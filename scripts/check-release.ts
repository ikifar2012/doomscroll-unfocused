import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../extension/manifest.json", import.meta.url), "utf8"));
const tag = process.env.RELEASE_TAG;

if (!tag || tag.replace(/^v/, "") !== manifest.version || packageJson.version !== manifest.version) {
  throw new Error(`Release tag (${tag}), manifest (${manifest.version}), and package (${packageJson.version}) versions must match.`);
}

console.log(`Building ${tag}`);
