// Spiegelt de/index.html nach index.html.
// Die Root liefert den deutschen Standardinhalt, ihre <link rel="canonical">
// zeigt aber auf /de/ — dadurch bleibt /de/ die einzige indexierte deutsche URL,
// waehrend teske-systemtechnik.de/ trotzdem crawlbar und brand-fuehig ist.
// Nach jeder Aenderung an de/index.html: `npm run sync-root`.
import { copyFileSync, statSync } from 'node:fs';

const src = 'de/index.html';
const dst = 'index.html';

copyFileSync(src, dst);
const { size } = statSync(dst);
console.log(`Synced ${src} -> ${dst} (${size} bytes)`);
