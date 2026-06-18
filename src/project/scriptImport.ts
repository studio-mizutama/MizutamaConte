/** 脚本 md/txt パーサ（純関数）。I/O・DOM 非依存でユニットテスト可能。
 *  仕様: docs/superpowers/specs/2026-06-18-script-md-import-design.md */

/** 1 カット分の中間表現。空カット（dialogue/action 共に空）は ParseResult に含めない。 */
export interface ParsedCut {
  /** そのシーン最初の非空カットにのみ付くシーンタイトル */
  sceneTitle?: string;
  /** ACTION 行を改行結合（無ければ ''） */
  action: string;
  /** DIALOGUE 行を改行結合（無ければ ''） */
  dialogue: string;
}

export interface ParseResult {
  title: string;
  cuts: ParsedCut[];
}

const NAME_MAX = 20;

/** 水平線（カット区切り）判定: ---, ***, ___, - - - など記号3個以上のみの行 */
const isHorizontalRule = (line: string): boolean => /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line);

/** 行頭の md 記法（引用/箇条書き/番号）とインライン強調記号を剥がし、中身だけ残す。前後空白は trim。 */
const stripLine = (raw: string): string => {
  let s = raw;
  s = s.replace(/^\s*>\s?/, ''); // 引用
  s = s.replace(/^\s*([-*+])\s+/, ''); // 箇条書き
  s = s.replace(/^\s*\d+[.)]\s+/, ''); // 番号付き
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1'); // 太字
  s = s.replace(/\*([^*]+)\*/g, '$1'); // 斜体
  s = s.replace(/__([^_]+)__/g, '$1'); // 太字(_)
  s = s.replace(/_([^_]+)_/g, '$1'); // 斜体(_)
  s = s.replace(/`([^`]+)`/g, '$1'); // インラインコード
  return s.trim();
};

/** 1 行を DIALOGUE / ACTION に分類する。プレフィックス（名前）は原文ママ保持。 */
const classify = (line: string): 'dialogue' | 'action' => {
  // コロン形: 名前: 文 / 名前：文（名前は空白・コロン・カギ括弧を含まず 1..NAME_MAX 文字）
  if (new RegExp(`^[^\\s:：「」]{1,${NAME_MAX}}[:：]\\s?.+$`).test(line)) return 'dialogue';
  // カギ括弧形: 名前「文」（閉じ 」 は任意。ただし途中で閉じて続きがある通常文は除外）
  const m = line.match(new RegExp(`^[^\\s「」]{1,${NAME_MAX}}「(.*)$`));
  if (m) {
    const rest = m[1];
    const endsWithClose = /」\s*$/.test(line);
    const closeInMiddle = rest.includes('」') && !endsWithClose;
    if (!closeInMiddle) return 'dialogue';
  }
  return 'action';
};

/** 配列先頭/末尾の空行を落として改行結合する（カット内部の空行は保持）。 */
const joinTrimmed = (lines: string[]): string => {
  let s = 0;
  let e = lines.length;
  while (s < e && lines[s].trim() === '') s++;
  while (e > s && lines[e - 1].trim() === '') e--;
  return lines.slice(s, e).join('\n');
};

export const parseScript = (text: string, fallbackName: string): ParseResult => {
  const lines = text.split(/\r\n|\r|\n/);

  let title = '';
  let titleSet = false;
  let collecting = false; // 取り込み中（最初のシーン見出し以降）
  let inCode = false;
  let pendingSceneTitle: string | undefined;

  const cuts: ParsedCut[] = [];
  let dialogueBuf: string[] = [];
  let actionBuf: string[] = [];
  let lastKind: 'dialogue' | 'action' | null = null;

  const flushCut = (): void => {
    const dialogue = joinTrimmed(dialogueBuf);
    const action = joinTrimmed(actionBuf);
    dialogueBuf = [];
    actionBuf = [];
    lastKind = null;
    if (dialogue === '' && action === '') return; // 空カットは作らない
    const cut: ParsedCut = { dialogue, action };
    if (pendingSceneTitle !== undefined) {
      cut.sceneTitle = pendingSceneTitle;
      pendingSceneTitle = undefined;
    }
    cuts.push(cut);
  };

  for (const raw of lines) {
    // コードフェンス（``` / ~~~）。フェンス行は捨て、内側は生のまま ACTION。
    if (/^\s*(```|~~~)/.test(raw)) {
      if (collecting) inCode = !inCode;
      continue;
    }
    if (inCode) {
      if (collecting) {
        actionBuf.push(raw);
        lastKind = 'action';
      }
      continue;
    }

    const heading = raw.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const htext = heading[2].trim();
      if (!titleSet) {
        titleSet = true;
        if (level === 1) {
          title = htext; // 先頭 h1 = 作品名（直下本文は collecting=false のまま無視）
        } else {
          title = fallbackName; // 先頭 h2-6 = ファイル名タイトル + シーン1
          pendingSceneTitle = htext;
          collecting = true;
        }
        continue;
      }
      if (collecting) flushCut();
      pendingSceneTitle = htext; // 見出し（途中 h1 含む）= シーン区切り
      collecting = true;
      continue;
    }

    if (!collecting) continue; // 見出し前 / h1 直下イントロは無視

    if (isHorizontalRule(raw)) {
      flushCut();
      continue;
    }

    const stripped = stripLine(raw);
    if (stripped === '') {
      // カット内部の空行は直近バケツに保持（先頭の空行は捨てる）
      if (lastKind === 'dialogue') dialogueBuf.push('');
      else if (lastKind === 'action') actionBuf.push('');
      continue;
    }
    const kind = classify(stripped);
    if (kind === 'dialogue') {
      dialogueBuf.push(stripped);
      lastKind = 'dialogue';
    } else {
      actionBuf.push(stripped);
      lastKind = 'action';
    }
  }
  flushCut(); // 最終カット

  if (!titleSet) title = '';
  return { title, cuts };
};
