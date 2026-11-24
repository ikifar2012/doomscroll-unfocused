import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const source = new URL("./", import.meta.url);
const output = new URL("./dist/", source);
const repository = new URL("../", source);

await rm(output, { recursive: true, force: true });
await mkdir(new URL("assets/", output), { recursive: true });

for (const file of ["index.html", "styles.css", "404.html", "_headers"]) {
  await copyFile(new URL(file, source), new URL(file, output));
}
await copyFile(new URL("extension/THIRD_PARTY_NOTICES.txt", repository), new URL("third-party-notices.txt", output));

for (const [input, name] of [
  ["extension/icons/icon-128.png", "icon.png"],
  ["assets/store/screenshot-light.png", "screenshot-light.png"],
  ["assets/store/screenshot-dark.png", "screenshot-dark.png"],
] as const) {
  await copyFile(new URL(input, repository), new URL(`assets/${name}`, output));
}

const privacy = await readFile(new URL("PRIVACY.md", repository), "utf8");
const template = await readFile(new URL("privacy.html", source), "utf8");
await writeFile(new URL("privacy.html", output), template.replace("{{PRIVACY}}", Bun.markdown.html(privacy)));
await writeFile(new URL("robots.txt", output), "User-agent: *\nAllow: /\nSitemap: https://doomscroll.mstep.dev/sitemap.xml\n");
await writeFile(new URL("sitemap.xml", output), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://doomscroll.mstep.dev/</loc></url><url><loc>https://doomscroll.mstep.dev/privacy</loc></url></urlset>\n');
console.log("Built static site in site/dist");
