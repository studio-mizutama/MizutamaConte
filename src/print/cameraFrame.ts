export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CameraFrameInput {
  /** 表示上のフレーム幅（px）= frame.width * scale。マージンを含まない作画フレーム実寸。 */
  frameW: number;
  /** 表示上のフレーム高（px）= frame.height * scale。 */
  frameH: number;
  /** 表示上のキャンバス幅（px）= canvas.width * scale。マージンを含む。 */
  displayW: number;
  /** 表示上のキャンバス高（px）= canvas.height * scale。 */
  displayH: number;
  cameraWork?: CameraWork;
}

/**
 * IN/OUT カメラ枠の矩形を算出する純粋関数。CutRow:552-599 の座標式を移植。
 * scale/position が揃っていない場合は該当枠を作らず空オブジェクトを返す。
 */
export const cameraFrames = (input: CameraFrameInput): { in?: Rect; out?: Rect } => {
  const { frameW, frameH, displayW, displayH, cameraWork } = input;
  // scale/position が存在しても in/out（の x/y）が欠けた壊れたデータでは枠を作らず空を返す（throw 防止）
  if (
    !cameraWork?.scale ||
    !Number.isFinite(cameraWork.scale.in) ||
    !Number.isFinite(cameraWork.scale.out) ||
    !cameraWork?.position?.in ||
    !cameraWork?.position?.out
  ) {
    return {};
  }
  const { scale, position } = cameraWork;
  return {
    in: {
      width: frameW * scale.in,
      height: frameH * scale.in,
      left: (displayW - frameW * (scale.in - position.in.x)) / 2,
      top: (displayH - frameH * (scale.in - position.in.y)) / 2,
    },
    out: {
      width: frameW * scale.out,
      height: frameH * scale.out,
      left: (displayW - frameW * (scale.out - position.out.x)) / 2,
      top: (displayH - frameH * (scale.out - position.out.y)) / 2,
    },
  };
};
