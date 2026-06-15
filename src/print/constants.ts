/** A4 縦・96dpi 換算。CSS px は 96dpi で物理長にマップされるため、印刷ページの寸法を px で持つ。 */
export const A4_WIDTH_PX = 794; // 210mm
export const A4_HEIGHT_PX = 1123; // 297mm
/** 上下左右の余白（@page margin 12mm 相当）。 */
export const PAGE_MARGIN_PX = 45; // ≒12mm
/** 余白を除いた本文領域。PrintView を画面外計測する際の幅にも使う。 */
export const PAGE_CONTENT_WIDTH = A4_WIDTH_PX - PAGE_MARGIN_PX * 2; // 704
export const PAGE_CONTENT_HEIGHT = A4_HEIGHT_PX - PAGE_MARGIN_PX * 2; // 1033
/** 各ページ先頭の見出し（タイトル＋列見出し）と末尾のページ番号の概算高さ。 */
export const PRINT_HEADER_HEIGHT = 64;
export const PRINT_FOOTER_HEIGHT = 24;
/** 1ページに収容できる CUT 群の高さ（本文高 − 見出し − フッター）。paginate に渡す。 */
export const PAGE_CUT_CAPACITY = PAGE_CONTENT_HEIGHT - PRINT_HEADER_HEIGHT - PRINT_FOOTER_HEIGHT; // 945
