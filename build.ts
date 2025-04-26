import fs from "fs";

const nativeTsTypes = [
    "Date",
    "Error",
    "Set"
]

let content = fs.readFileSync("./node_modules/discord.js/typings/index.d.ts", "utf-8")
    .replace(/\/\/[^\n]+/, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .match(/interface ClientEvents \{[^\}]+\}/)?.[0]
    .replaceAll("[", "{")
    .replaceAll("]", "}")
    .replaceAll("ClientEvents", "TessenClientEvents")
    .replace("interface", "export interface")
    .replaceAll(/TessenClientEvents\{(["'][^\"\']+['"])\}/g, (match, m1) => {
        return match.replace(/\{/, "[")
            .replace(/\}/, "]");
    })
    ?? "";

let blocks = content
    .replace(/^[^\n]+/, "")
    .replace(/[^\n]+$/, "")
    .match(/\{[^\}]+\}/g) ?? []

let toImport: string[] = [];

for (const block of blocks) {
    const typeRegex = /\b([A-Z][a-zA-Z0-9]*)\b/g;
    let match;
    while ((match = typeRegex.exec(block)) !== null) {
        const typeName = match[1] as any;
        if (!toImport.includes(typeName) && !nativeTsTypes.includes(typeName)) {
            toImport.push(typeName);
        }
    }
}

for (const block of blocks) {
    if (!block.includes("\n")) {
        let newBlock = block.replace("{", "{ ").replace("}", " }");
        content = content.replace(block, newBlock);
    }
}

fs.writeFileSync("./src/lib/types/ClientEvents.ts", `import { ${toImport.join(", ")} } from "discord.js";\n\n${content}`, "utf-8");