const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const root = path.resolve("src");
const changes = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;

    const original = fs.readFileSync(fullPath, "utf8");
    const source = ts.createSourceFile(
      fullPath, original, ts.ScriptTarget.Latest, true
    );

    const replacements = [];

    function visit(node) {
      let literal;

      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        literal = node.moduleSpecifier;
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        literal = node.arguments[0];
      }

      if (literal) {
        const specifier = literal.text;

        if (
          specifier.startsWith(".") &&
          !/\.(js|mjs|cjs|json)$/.test(specifier)
        ) {
          const target = path.resolve(path.dirname(fullPath), specifier);

          const exists = [".ts", ".tsx", ".d.ts"].some(ext =>
            fs.existsSync(target + ext)
          ) || fs.existsSync(path.join(target, "index.ts"));

          if (exists) {
            const start = literal.getStart(source) + 1;
            const end = literal.getEnd() - 1;

            replacements.push({
              start,
              end,
              oldValue: specifier,
              newValue: specifier + ".js"
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(source);

    if (replacements.length) {
      changes.push({ fullPath, original, replacements });
    }
  }
}

walk(root);

const report = [];
for (const file of changes) {
  let updated = file.original;

  for (const item of [...file.replacements].sort((a, b) => b.start - a.start)) {
    updated =
      updated.slice(0, item.start) +
      item.newValue +
      updated.slice(item.end);
    report.push(`${path.relative(root, file.fullPath)}: ${item.oldValue} -> ${item.newValue}`);
  }

  fs.writeFileSync(file.fullPath, updated, "utf8");
}

fs.writeFileSync(
  "esm-import-fix-report.txt",
  report.join("\n") + `\n\nTotal import updates: ${report.length}\n`,
  "utf8"
);

console.log(`Files updated: ${changes.length}`);
console.log(`Import updates: ${report.length}`);
console.log("Report saved to esm-import-fix-report.txt");
