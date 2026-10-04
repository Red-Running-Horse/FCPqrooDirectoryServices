// fix-tests.mjs — run once from the repo root:  node fix-tests.mjs
// Updates test/attractions.test.mjs expectations to match the cleaned source
// data (paste artifacts removed from app/attractions.mjs). The tests previously
// pinned the corrupted values ("Calle 60 \nCopied\n#788\n" etc.) as baselines.
// Review with: git diff test/attractions.test.mjs
import { readFileSync, writeFileSync } from "node:fs";

const file = "test/attractions.test.mjs";
let s = readFileSync(file, "utf8");

// Order matters: the longer regex pattern must be replaced before the shorter one.
const pairs = [
  ['"Calle 60 \\nCopied\\n#788\\"', '"Calle 60 #788"'],
  ['"60 Street \\nCopied\\n#788\\"', '"60 Street #788"'],
  ['"Calle 67 \\nCopied\\n#768\\"', '"Calle 67 #768"'],
  ['"67 Street \\nCopied\\n#768\\"', '"67 Street #768"'],
  ['/Calle 60 \\nCopied\\n#788\\n/', '/Calle 60 #788/'],
  ['/Calle 67 \\nCopied\\n#768\\n, Col. Centro/', '/Calle 67 #768, Col. Centro/'],
  ['/Calle 67 \\nCopied\\n#768\\n/', '/Calle 67 #768/'],
];

let problems = 0;
for (const [from, to] of pairs) {
  const count = s.split(from).length - 1;
  if (count === 0) {
    console.log("NOT FOUND (check manually):", from);
    problems += 1;
  } else {
    console.log(`replaced ${count}x:`, from, "->", to);
    s = s.split(from).join(to);
  }
}

if (problems > 0) {
  console.log("WARNING: some patterns were missing — inspect test/attractions.test.mjs manually.");
  process.exit(1);
}

writeFileSync(file, s);
console.log("Done. Now run: npm test");
