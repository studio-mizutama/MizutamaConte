// build:docs の後に実行（package.json で && チェーン）。
// build/docs 配下で index.html を持つディレクトリを走査して sitemap.xml を生成する。
// PAGES/LOCALES を二重定義せず「実際の出力＝単一の真実」から作るので、ページ追加にも自動追従。
// root 直下の index.html（= リダイレクタ・非コンテンツ）は対象外（子ディレクトリのみ採用）。
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://studio-mizutama.github.io';
const BASE = '/MizutamaConte/docs/';
const ROOT = 'build/docs';

/** index.html を持つ子ディレクトリの相対パス（例 'ja', 'ja/usage'）を収集 */
const dirs = [];
const walk = (rel) => {
  for (const ent of readdirSync(join(ROOT, rel || '.'), { withFileTypes: true })) {
    if (!ent.isDirectory() || ent.name === 'assets') continue;
    const childRel = rel ? `${rel}/${ent.name}` : ent.name;
    if (existsSync(join(ROOT, childRel, 'index.html'))) dirs.push(childRel);
    walk(childRel);
  }
};
walk('');
dirs.sort();

const urls = dirs.map((d) => `${ORIGIN}${BASE}${d}/`);
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
  `\n</urlset>\n`;

writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} urls`);
