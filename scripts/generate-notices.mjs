// 本番依存のライセンスから THIRD-PARTY-NOTICES を生成するスクリプト
// license-checker は CommonJS のため createRequire で読み込む
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const checker = require('license-checker');

const OUTPUT_PATH = 'public/third-party-notices.txt';
const SEPARATOR = '='.repeat(64);

checker.init({ start: '.', production: true, json: true }, (err, packages) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const lines = [
    'Mizutama Conte — Third-Party Notices',
    '',
    'This application bundles the following open-source software.',
    '',
  ];

  for (const [name, info] of Object.entries(packages)) {
    lines.push(SEPARATOR);
    lines.push(`${name}  —  ${info.licenses}`);
    if (info.repository) lines.push(info.repository);
    lines.push('');
    if (info.licenseFile) {
      try {
        // ライセンス本文（コピーライト表記を含む）を埋め込む
        lines.push(readFileSync(info.licenseFile, 'utf8').trim());
      } catch {
        // ライセンスファイルが読めない場合はスキップ
      }
    }
    lines.push('', '');
  }

  writeFileSync(OUTPUT_PATH, lines.join('\n'));
  console.log(`Wrote ${OUTPUT_PATH} (${Object.keys(packages).length} packages)`);
});
