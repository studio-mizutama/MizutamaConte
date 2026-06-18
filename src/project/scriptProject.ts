import { ProjectFile, ProjectSettings, ProjectCut, PsdCache } from './types';
import { newId } from './load';
import { createTemplatePsd } from '../psd/template';
import { ParseResult } from './scriptImport';

export interface ScriptBuild {
  project: ProjectFile;
  cache: PsdCache;
  psdFiles: { name: string; buffer: Uint8Array }[];
}

/** パース結果から、各カットに空 PSD 雛形を生成して新規プロジェクトを組み立てる。
 *  ディスクには触らない（buffer をメモリ上に用意するだけ）。title は呼び出し側で
 *  作成フォルダ名に差し替える前提（ここでは parsed.title を入れておく）。
 *  カットのキャンバスはネイティブ frame・PSD 名は cNNN.psd・time=fps*3・1 行（layer '1'）で、
 *  addCut（useProjectActions）の規約に揃える。 */
export const buildProjectFromScript = (parsed: ParseResult, settings: ProjectSettings): ScriptBuild => {
  const canvas = { ...settings.frame }; // 新規カットはネイティブ解像度（addCut と同じ）
  const cache: PsdCache = {};
  const psdFiles: { name: string; buffer: Uint8Array }[] = [];

  const cuts: ProjectCut[] = parsed.cuts.map((pc, i) => {
    const psdName = `c${String(i + 1).padStart(3, '0')}.psd`;
    const { psd, buffer } = createTemplatePsd(canvas.width, canvas.height);
    cache[psdName] = psd;
    psdFiles.push({ name: psdName, buffer });
    const cut: ProjectCut = {
      id: newId(),
      psd: psdName,
      time: settings.fps * 3,
      rows: [{ id: newId(), layer: '1', dialogue: pc.dialogue, canvas: { ...canvas } }],
    };
    if (pc.sceneTitle !== undefined) cut.sceneStart = { title: pc.sceneTitle };
    if (pc.action) cut.action = { text: pc.action };
    return cut;
  });

  const project: ProjectFile = { version: 2, title: parsed.title, settings, cuts };
  return { project, cache, psdFiles };
};
