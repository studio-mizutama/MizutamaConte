/**
 * ある frame でアクティブな（preTimeSum <= frame < timeSum を満たす）カットの描画状態を返す純関数。
 * Preview.tsx の effect 経路(105-143)・JSX 経路(181-289)の数式を逐語移植したもの。
 * Preview と動画書き出しで同一の見た目を保証するための単一の数式ソース。
 *
 * NOTE: 値は表示フィット率 `ratio` に非依存（scale/pos/opacity/layerIndex のみ）。
 *       ピクセル幾何（描画座標・寸法）は video/geometry.ts の layerDrawRect が担当する。
 */
import { getFrameModel } from 'project/frameModel';

export interface ActiveCutState {
  /** cuts 配列上のインデックス */
  cutIndex: number;
  /** 表示するフレームユニットの index（0基点・FrameModel.units 添字。背景は別途毎フレーム描画） */
  unitIndex: number;
  /** カメラ scale（in→out のリニア補間。1=ネイティブ） */
  scale: number;
  /** カメラ位置 X（フレーム単位のパン量） */
  posX: number;
  /** カメラ位置 Y */
  posY: number;
  /** 外側（白地）の不透明度。Black In/Out の時のみ setOpacity、他は 1 */
  divOpacity: number;
  /** 絵レイヤーの不透明度。フェード種別を問わず常に setOpacity */
  canvasOpacity: number;
}

export const frameState = (frame: number, cuts: Cut[]): ActiveCutState | null => {
  let preTimeSum = 0;
  for (let index = 0; index < cuts.length; index++) {
    const cut = cuts[index];
    const time = cut.time || 0;
    const timeSum = preTimeSum + time;
    if (preTimeSum <= frame && frame < timeSum) {
      const localRaw = frame - preTimeSum; // レイヤー選択は生の相対フレーム（Preview の effect/JSX と同じ）
      const local = localRaw || 1; // scale/pos/opacity は 0 を 1 に補正（Preview の `currentFrame || 1`）
      // フレームユニット数（単独レイヤー or グループ）。フラットPSDでは従来の children.length-1 と一致。
      const pictureNumber = cut.picture ? getFrameModel(cut.picture).units.length : 0;
      const pictureShowDuration = pictureNumber ? time / pictureNumber : 0;
      const unitIndex = pictureShowDuration ? Math.trunc((localRaw / pictureShowDuration) | 0) : 0;

      const scaleIn = cut.cameraWork?.scale?.in || 1;
      const scaleOut = cut.cameraWork?.scale?.out || 1;
      const scale = scaleIn - ((scaleIn - scaleOut) * local) / time;

      const xIn = cut.cameraWork?.position?.in.x || 0;
      const xOut = cut.cameraWork?.position?.out.x || 0;
      const yIn = cut.cameraWork?.position?.in.y || 0;
      const yOut = cut.cameraWork?.position?.out.y || 0;
      const posX = xIn - ((xIn - xOut) * local) / time;
      const posY = yIn - ((yIn - yOut) * local) / time;

      const fadeInDuration = cut.action?.fadeInDuration || 0;
      const fadeOutDuration = cut.action?.fadeOutDuration || 0;
      const fadeOutTime = time - fadeOutDuration;
      const setOpacity = (cf: number): number => {
        if (0 <= cf && cf < fadeInDuration) return cf / fadeInDuration;
        if (fadeOutTime <= cf && cf <= time) return 1 - (cf - fadeOutTime) / fadeOutDuration;
        return 1;
      };
      const canvasOpacity = setOpacity(local);
      const isBlack = cut.action?.fadeIn === 'Black In' || cut.action?.fadeOut === 'Black Out';
      const divOpacity = isBlack ? setOpacity(local) : 1;

      return { cutIndex: index, unitIndex, scale, posX, posY, divOpacity, canvasOpacity };
    }
    preTimeSum = timeSum;
  }
  return null;
};
