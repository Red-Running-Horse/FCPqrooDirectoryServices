// fix-artifacts.mjs — run once from the repo root:  node fix-artifacts.mjs
// Cleans the Google Maps paste artifacts in app/attractions.mjs:
//   1) literal " \nCopied\n" sequences inside address/description strings
//   2) leftover literal "\n" right after street numbers (#788\n / #768\n)
//   3) leaked footnote markers " \n2", " \n1", " \n3", " \n4"
// It rewrites only those patterns and reports what it changed. Review with
// `git diff app/attractions.mjs` before committing.
import { readFileSync, writeFileSync } from "node:fs";

const file = "app/attractions.mjs";
let s = readFileSync(file, "utf8");

const before = {
  copied: (s.match(/\\nCopied\\n/g) || []).length,
  footnotes: (s.match(/ ?\\n\d(?=[,.; ])/g) || []).length,
};

// 1) "Calle 60 \nCopied\n#788\n" -> "Calle 60 #788\n"
s = s.replace(/ ?\\nCopied\\n/g, " ");
// 2) "#788\n (esquina" -> "#788 (esquina"  (also #768)
s = s.replace(/#788\\n/g, "#788").replace(/#768\\n/g, "#768");
// 3) "May Pech \n2," -> "May Pech,"  (leaked footnote markers)
s = s.replace(/ ?\\n\d(?=[,.; ])/g, "");

writeFileSync(file, s);

const after = {
  copied: (s.match(/\\nCopied\\n/g) || []).length,
  footnotes: (s.match(/ ?\\n\d(?=[,.; ])/g) || []).length,
};

console.log("Copied artifacts:", before.copied, "->", after.copied);
console.log("Footnote markers:", before.footnotes, "->", after.footnotes);
if (after.copied === 0 && after.footnotes === 0) {
  console.log("Clean. Now run: git diff app/attractions.mjs  (review), then");
  console.log("npm run generate:places && npm test && npm run build");
} else {
  console.log("WARNING: some artifacts remain — inspect manually.");
}
