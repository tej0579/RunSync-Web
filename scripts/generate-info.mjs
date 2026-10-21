import fs from "node:fs";
import path from "node:path";

const targetDirs = ["app", "components", "hooks", "lib", "types"];
const individualFiles = ["next.config.ts", "firestore.rules"];
const codeFiles = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      codeFiles.push(fullPath);
    }
  }
}

for (const d of targetDirs) {
  scanDir(d);
}
for (const f of individualFiles) {
  if (fs.existsSync(f)) codeFiles.push(f);
}

codeFiles.sort();

let output = "// ================================================================\n";
output += "// RunSync 2.0 - Complete Production-Hardened Application Code Export\n";
output += `// Generated: ${new Date().toISOString()}\n`;
output += `// Total files included: ${codeFiles.length}\n`;
output += "// ================================================================\n\n";

for (const file of codeFiles) {
  const normPath = file.replace(/\\/g, "/");
  output += "//////////////////////////////////////////////////////////////////\n";
  output += `// FILE: ${normPath}\n`;
  output += "//////////////////////////////////////////////////////////////////\n\n";
  output += fs.readFileSync(file, "utf8");
  output += "\n\n";
}

fs.writeFileSync("info.txt", output, "utf8");
console.log(`Successfully generated info.txt with ${codeFiles.length} files.`);
