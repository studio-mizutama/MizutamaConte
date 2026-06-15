import React, { useMemo } from 'react';
import { Layer } from 'ag-psd';
import { FrameSize } from 'project/types';
import { thumbnailScale } from 'project/dimensions';
import { canvasToDataURL } from 'psd/thumbnail';
import { frameToTimecode } from 'project/time';
import { cameraFrames, Rect } from 'print/cameraFrame';
import { Page } from 'print/paginate';

const rectStyle = (r: Rect): React.CSSProperties => ({
  position: 'absolute',
  left: `${r.left}px`,
  top: `${r.top}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
});

/** 1 CUT 行。data-cut-index は PrintHost の高さ実測に使う。 */
const PrintCutRow: React.FC<{
  index: number;
  cut: Cut;
  frame: FrameSize;
  fps: number;
  timeSum: number;
}> = ({ index, cut, frame, fps, timeSum }) => {
  const thumbScale = thumbnailScale(frame);
  const frameW = frame.width * thumbScale;
  const frameH = frame.height * thumbScale;
  // children[0] はベース（フレーム枠）なので除外。children[1..] が時系列フリップブックのレイヤー
  const children = (cut.picture?.children ?? []) as Layer[];
  const layers = children.filter((_child, i) => i !== 0);
  return (
    <div className="print-cut" data-cut-index={index}>
      <div className="print-col-cut">{index + 1}</div>
      <div className="print-col-picture">
        {layers.map((child, layerI, arr) => {
          const src = canvasToDataURL(child.canvas);
          const dispW = (child.canvas?.width ?? 0) * thumbScale;
          const dispH = (child.canvas?.height ?? 0) * thumbScale;
          const frames = cameraFrames({ frameW, frameH, displayW: dispW, displayH: dispH, cameraWork: cut.cameraWork });
          return (
            <div key={`p${index}-${layerI}`} style={{ position: 'relative', width: `${dispW}px`, height: `${dispH}px` }}>
              <div style={{ width: `${dispW}px`, height: `${dispH}px`, position: 'relative', background: '#fff' }}>
                <img src={src} alt="cut" style={{ transform: `scale(${thumbScale})`, transformOrigin: 'left top' }} />
              </div>
              {layerI === 0 && frames.in && (
                <div className="print-frame-in" style={rectStyle(frames.in)}>
                  IN
                </div>
              )}
              {layerI === arr.length - 1 && frames.out && (
                <div className="print-frame-out" style={rectStyle(frames.out)}>
                  OUT
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="print-col-action">{cut.action?.text ?? ''}</div>
      <div className="print-col-dialogue">{cut.dialogue ?? ''}</div>
      <div className="print-col-time">
        <div>{frameToTimecode(cut.time ?? 0, fps)}</div>
        <div className="print-time-sum">{frameToTimecode(timeSum, fps)}</div>
      </div>
    </div>
  );
};

const PrintHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="print-header">
    <div className="print-title">{title}</div>
    <div className="print-colhead">
      <div className="print-col-cut">CUT</div>
      <div className="print-col-picture">PICTURE</div>
      <div className="print-col-action">ACTION</div>
      <div className="print-col-dialogue">DIALOGUE</div>
      <div className="print-col-time">TIME</div>
    </div>
  </div>
);

export interface PrintViewProps {
  title: string;
  cuts: Cut[];
  frame: FrameSize;
  fps: number;
  /** null = 計測パス（全 CUT フラット）。指定でページ確定描画。 */
  pages: Page[] | null;
}

export const PrintView: React.FC<PrintViewProps> = ({ title, cuts, frame, fps, pages }) => {
  // 累積尺（各 CUT までの合計フレーム数）
  const timeSums = useMemo(() => {
    let acc = 0;
    return cuts.map((c) => (acc += c.time ?? 0));
  }, [cuts]);

  if (!pages) {
    return (
      <div className="print-doc">
        <PrintHeader title={title} />
        {cuts.map((cut, i) => (
          <PrintCutRow key={i} index={i} cut={cut} frame={frame} fps={fps} timeSum={timeSums[i]} />
        ))}
      </div>
    );
  }

  return (
    <div className="print-doc">
      {pages.map((page) => (
        <div className="print-page" key={page.pageNumber}>
          <PrintHeader title={title} />
          {page.cutIndices.map((i) => (
            <PrintCutRow key={i} index={i} cut={cuts[i]} frame={frame} fps={fps} timeSum={timeSums[i]} />
          ))}
          <div className="print-footer">{`${page.pageNumber} / ${pages.length}`}</div>
        </div>
      ))}
    </div>
  );
};
