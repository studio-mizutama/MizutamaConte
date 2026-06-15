/** A4 縦・96dpi 換算。CSS px は 96dpi で物理長にマップされるため、印刷ページの寸法を px で持つ。 */
export const A4_WIDTH_PX = 794; // 210mm
export const A4_HEIGHT_PX = 1123; // 297mm
/** 視覚マージン（12mm 相当）。ブラウザのヘッダー/フッター抑止のため @page margin:0 にし、
 *  このマージンは .print-page の padding として内側に作る。 */
export const PAGE_MARGIN_PX = 45; // ≒12mm
/** padding を除いた本文の幅。PrintView の画面外計測幅にも使う。 */
export const PAGE_CONTENT_WIDTH = A4_WIDTH_PX - PAGE_MARGIN_PX * 2; // 704
/** 印刷フラグメンテーションの丸め誤差で次シートへ溢れる/余分な空白頁が出るのを防ぐ安全マージン。 */
export const PAGE_SAFETY_PX = 48;
/** .print-page の border-box 高さ（ほぼ1シート分。A4 高より少し小さく保ち溢れさせない）。 */
export const PAGE_BOX_HEIGHT = A4_HEIGHT_PX - PAGE_SAFETY_PX; // 1075
/** padding を除いた本文の高さ。 */
export const PAGE_CONTENT_HEIGHT = PAGE_BOX_HEIGHT - PAGE_MARGIN_PX * 2; // 985
/** 各ページ先頭の見出し（タイトル＋列見出し）と末尾のページ番号の概算高さ。 */
export const PRINT_HEADER_HEIGHT = 64;
export const PRINT_FOOTER_HEIGHT = 24;
/** 1ページに収容できる CUT 群の高さ（本文高 − 見出し − フッター）。paginate に渡す。 */
export const PAGE_CUT_CAPACITY = PAGE_CONTENT_HEIGHT - PRINT_HEADER_HEIGHT - PRINT_FOOTER_HEIGHT; // 897
