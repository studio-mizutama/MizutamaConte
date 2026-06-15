import React, { useMemo } from 'react';
import { Layer } from 'ag-psd';
import { FrameSize } from 'project/types';
import { SceneGroup } from 'project/scene';
import { thumbnailScale } from 'project/dimensions';
import { canvasToDataURL } from 'psd/thumbnail';
import { frameToTimecode } from 'project/time';
import { cameraFrames, Rect } from 'print/cameraFrame';
import { Page } from 'print/paginate';
import { useT, TranslationKey } from 'i18n';

const rectStyle = (r: Rect): React.CSSProperties => ({
  position: 'absolute',
  left: `${r.left}px`,
  top: `${r.top}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
});

/** フェード種別（保存値）→ i18n キー。CutRow の fadeLabelKey と対応（印刷では全ロケール英語）。 */
const fadeLabelKey = (fade: string): TranslationKey => {
  switch (fade) {
    case 'White In':
      return 'transition.fade.whiteIn';
    case 'Black In':
      return 'transition.fade.blackIn';
    case 'White Out':
      return 'transition.fade.whiteOut';
    case 'Black Out':
      return 'transition.fade.blackOut';
    case 'Cross':
      return 'transition.fade.cross';
    default:
      return 'transition.fade.none';
  }
};

// トランジション記号（CutRow と同じリング三角の SVG パス）。Cross 専用アイコンは持たず、
// 種別はテキストラベルで示す。fill は CSS で黒。
const FadeInTriangle: React.FC = () => (
  <svg viewBox="0 0 96 48" width="56" height="28">
    <path d="M48,2.83,91.17,46H4.83L48,2.83M48,0,0,48H96L48,0Z" />
  </svg>
);
const FadeOutTriangle: React.FC = () => (
  <svg viewBox="0 0 96 48" width="56" height="28">
    <path d="M91.17,2,48,45.17,4.83,2H91.17M96,0Zm0,0H0L48,48,96,0Z" />
  </svg>
);

/** 1 CUT 行。data-cut-index は PrintHost の高さ実測に使う。 */
const PrintCutRow: React.FC<{
  index: number;
  cut: Cut;
  frame: FrameSize;
  fps: number;
  timeSum: number;
  /** ページ最下段のカットか（booktabs の bottomrule＝太線を引くため）。 */
  lastOnPage?: boolean;
}> = ({ index, cut, frame, fps, timeSum, lastOnPage }) => {
  const t = useT();
  const thumbScale = thumbnailScale(frame);
  const frameW = frame.width * thumbScale;
  const frameH = frame.height * thumbScale;
  const action = cut.action;
  // children[0] はベース（フレーム枠）なので除外。children[1..] が時系列フリップブックのレイヤー
  const children = (cut.picture?.children ?? []) as Layer[];
  const layers = children.filter((_child, i) => i !== 0);
  return (
    <div className={`print-block${lastOnPage ? ' print-block-last' : ''}`} data-cut-index={index}>
      <div className="print-cut">
        <div className="print-col-cut">{index + 1}</div>
        <div className="print-col-picture">
          {layers.map((child, layerI, arr) => {
            const src = canvasToDataURL(child.canvas);
            const dispW = (child.canvas?.width ?? 0) * thumbScale;
            const dispH = (child.canvas?.height ?? 0) * thumbScale;
            const frames = cameraFrames({ frameW, frameH, displayW: dispW, displayH: dispH, cameraWork: cut.cameraWork });
            return (
              <div
                key={`p${index}-${layerI}`}
                style={{ position: 'relative', width: `${dispW}px`, height: `${dispH}px`, background: '#fff' }}
              >
                {/* transform:scale ではなく実寸 width/height で描画する。transform だと img の
                    レイアウトボックスが原寸のままになり、印刷のページ分割で各カットが原寸高に
                    膨らんで「改ページされまくる」。実寸でレイアウトさせ計測＝印刷高を一致させる。 */}
                <img src={src} alt="cut" style={{ width: `${dispW}px`, height: `${dispH}px`, display: 'block' }} />
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
        <div className="print-col-action">
          {action?.fadeIn && (
            <div className="print-fade">
              <FadeInTriangle />
              <span className="print-fade-label">{`${t(fadeLabelKey(action.fadeIn))} ${Math.round(action.fadeInDuration ?? 0)}`}</span>
            </div>
          )}
          <div className="print-action-text">{action?.text ?? ''}</div>
          {action?.fadeOut && (
            <div className="print-fade">
              <FadeOutTriangle />
              <span className="print-fade-label">{`${t(fadeLabelKey(action.fadeOut))} ${Math.round(action.fadeOutDuration ?? 0)}`}</span>
            </div>
          )}
        </div>
        <div className="print-col-dialogue">{cut.dialogue ?? ''}</div>
        <div className="print-col-time">
          <div>{frameToTimecode(cut.time ?? 0, fps)}</div>
          <div className="print-time-sum">{frameToTimecode(timeSum, fps)}</div>
        </div>
      </div>
    </div>
  );
};

/** 各ページ先頭の繰り返し見出し。上段＝プロジェクト名 / SCENE N タイトル / ページ番号、下段＝列見出し。 */
const PrintHeader: React.FC<{ title: string; scene?: SceneGroup; pageLabel?: string }> = ({ title, scene, pageLabel }) => (
  <div className="print-header">
    <div className="print-pagehead">
      <span className="ph-title">{title}</span>
      <span className="ph-scene">
        {scene ? `SCENE ${scene.sceneNumber}${scene.title ? ` ${scene.title}` : ''}` : ''}
      </span>
      <span className="ph-page">{pageLabel ?? ''}</span>
    </div>
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
  scenes: SceneGroup[];
  frame: FrameSize;
  fps: number;
  /** null = 計測パス（全 CUT フラット）。指定でページ確定描画。 */
  pages: Page[] | null;
}

export const PrintView: React.FC<PrintViewProps> = ({ title, cuts, scenes, frame, fps, pages }) => {
  // 累積尺（各 CUT までの合計フレーム数）
  const timeSums = useMemo(() => {
    let acc = 0;
    return cuts.map((c) => (acc += c.time ?? 0));
  }, [cuts]);
  // 各 CUT index → 所属シーン（ページ見出しに出す SCENE N の判定）
  const sceneByCut = useMemo(() => {
    const m = new Map<number, SceneGroup>();
    scenes.forEach((s) => s.cutIndices.forEach((ci) => m.set(ci, s)));
    return m;
  }, [scenes]);

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
          <PrintHeader
            title={title}
            scene={sceneByCut.get(page.cutIndices[0])}
            pageLabel={`${page.pageNumber} / ${pages.length}`}
          />
          {page.cutIndices.map((i, j) => (
            <PrintCutRow
              key={i}
              index={i}
              cut={cuts[i]}
              frame={frame}
              fps={fps}
              timeSum={timeSums[i]}
              lastOnPage={j === page.cutIndices.length - 1}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
