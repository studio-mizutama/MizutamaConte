/**
 * ある frame でアクティブなカットの描画状態を返す純関数群。
 * cutOffsets の span（重なり反映済み）を基点に、ユニット/カメラ/opacity を算出する。
 * Preview と動画書き出しで同一の見た目を保証するための単一の数式ソース。
 *
 * NOTE: 値は表示フィット率 `ratio` に非依存（scale/pos/opacity/unitIndex のみ）。
 *       ピクセル幾何（描画座標・寸法）は video/geometry.ts の layerDrawRect が担当する。
 */
import { getFrameModel } from 'project/frameModel';
import { cutOffsets } from 'project/cutOffsets';

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

/**
 * 1カットの描画状態を算出。start = そのカットのグローバル開始フレーム（cutOffsets 由来）。
 * 単独区間ではフェードランプをそのまま適用（Black/White/None 完全互換）。
 */
const computeState = (cut: Cut, index: number, start: number, frame: number): ActiveCutState => {
  const time = cut.time || 0;
  const localRaw = frame - start; // レイヤー選択は生の相対フレーム
  const local = localRaw || 1; // scale/pos/opacity は 0 を 1 に補正（Preview の `currentFrame || 1`）

  const pictureNumber = cut.picture ? getFrameModel(cut.picture).units.length : 0;
  const pictureShowDuration = pictureNumber ? time / pictureNumber : 0;
  const unitIndex = pictureShowDuration ? Math.trunc(localRaw / pictureShowDuration) : 0;

  const scaleIn = cut.cameraWork?.scale?.in || 1;
  const scaleOut = cut.cameraWork?.scale?.out || 1;
  const scale = scaleIn - ((scaleIn - scaleOut) * local) / time;

  const xIn = cut.cameraWork?.position?.in?.x || 0;
  const xOut = cut.cameraWork?.position?.out?.x || 0;
  const yIn = cut.cameraWork?.position?.in?.y || 0;
  const yOut = cut.cameraWork?.position?.out?.y || 0;
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
};

/**
 * frame を含む全カットを start 昇順で返す（通常1件・クロス重なりで2件・連続クロスで稀に3件）。
 * 重なりは必ず Cross（非クロスは半開区間で重ならない）なので、最後発以外＝先発カットは
 * canvasOpacity=1 に上書きする（fadeOut ランプを適用しない＝重ねで消えるため）。
 * 後発カットは標準の setOpacity（= cross fadeIn ランプ）のまま。
 * source-over で「白地 → A@1 → B@t」を重ねると出力 = A*(1−t)+B*t の真クロスディゾルブになる。
 */
export const frameStates = (frame: number, cuts: Cut[]): ActiveCutState[] => {
  const spans = cutOffsets(cuts);
  const states: ActiveCutState[] = [];
  for (let i = 0; i < cuts.length; i++) {
    if (spans[i].start <= frame && frame < spans[i].end) {
      states.push(computeState(cuts[i], i, spans[i].start, frame));
    }
  }
  for (let k = 0; k < states.length - 1; k++) {
    states[k] = { ...states[k], canvasOpacity: 1 };
  }
  return states;
};

/** 現在カット（choice B = 最後発）の描画状態。範囲外は null。既存 API 互換。 */
export const frameState = (frame: number, cuts: Cut[]): ActiveCutState | null => {
  const states = frameStates(frame, cuts);
  return states.length ? states[states.length - 1] : null;
};
