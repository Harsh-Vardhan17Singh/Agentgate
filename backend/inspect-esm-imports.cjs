const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const root = path.resolve("src");
let count = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;

    const source = ts.createSourceFile(
      fullPath,
      fs.readFileSync(fullPath, "utf8"),
      ts.ScriptTarget.Latest,
      true
    );

    function check(node) {
      let specifier;

      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        specifier = node.moduleSpecifier.text;
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        specifier = node.arguments[0].text;
      }

      if (specifier && specifier.startsWith(".")) {
        const target = path.resolve(path.dirname(fullPath), specifier);
        const exists = [".ts", ".tsx", ".d.ts"].some(ext =>
          fs.existsSync(target + ext)
        ) || fs.existsSync(path.join(target, "index.ts"));

        if (exists && !/\.(js|mjs|cjs|json)$/.test(specifier)) {
          console.log(`${path.relative(root, fullPath)}: ${specifier}`);
          count++;
        }
      }

      ts.forEachChild(node, check);
    }

    check(source);
  }
}

walk(root);
console.log(`Total extensionless relative imports/exports: ${count}`);
