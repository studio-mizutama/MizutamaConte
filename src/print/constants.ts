/** A4 縦・96dpi 換算。CSS px は 96dpi で物理長にマップされるため、印刷ページの寸法を px で持つ。 */
export const A4_WIDTH_PX = 794; // 210mm
export const A4_HEIGHT_PX = 1123; // 297mm
/** 上下左右の余白（@page margin 12mm 相当）。 */
export const PAGE_MARGIN_PX = 45; // ≒12mm
/** 余白を除いた本文領域（物理シートの印刷可能サイズ）。PrintView の画面外計測幅にも使う。 */
export const PAGE_CONTENT_WIDTH = A4_WIDTH_PX - PAGE_MARGIN_PX * 2; // 704
export const PAGE_CONTENT_HEIGHT = A4_HEIGHT_PX - PAGE_MARGIN_PX * 2; // 1033
/** 印刷フラグメンテーションの丸め誤差で次シートへ溢れるのを防ぐ安全マージン。 */
export const PAGE_SAFETY_PX = 48;
/** .print-page の min-height。footer を下端付近へ押すが、印刷可能高より小さく保ち溢れさせない。 */
export const PAGE_BOX_HEIGHT = PAGE_CONTENT_HEIGHT - PAGE_SAFETY_PX; // 985
/** 各ページ先頭の見出し（タイトル＋列見出し）と末尾のページ番号の概算高さ。 */
export const PRINT_HEADER_HEIGHT = 64;
export const PRINT_FOOTER_HEIGHT = 24;
/** 1ページに収容できる CUT 群の高さ（PAGE_BOX_HEIGHT − 見出し − フッター）。paginate に渡す。 */
export const PAGE_CUT_CAPACITY = PAGE_BOX_HEIGHT - PRINT_HEADER_HEIGHT - PRINT_FOOTER_HEIGHT; // 897
