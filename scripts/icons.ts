import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Preserve Lucide's paths; apply a single color and add store-icon padding.
const source = readFileSync(new URL("../assets/circle-fading-play.svg", import.meta.url), "utf8");
const directory = new URL("../extension/icons/", import.meta.url);
mkdirSync(directory, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  const svg = source
    .replace('stroke="currentColor"', 'stroke="#6366f1"')
    .replace('viewBox="0 0 24 24"', size === 128 ? 'viewBox="-3 -3 30 30"' : 'viewBox="0 0 24 24"');
  const renderer = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  writeFileSync(new URL(`icon-${size}.png`, directory), renderer.render().asPng());
}
