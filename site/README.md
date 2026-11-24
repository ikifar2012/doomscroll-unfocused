# Project website

Static landing and privacy pages for `https://doomscroll.mstep.dev`.
Cloudflare's fallback origin is `https://doomscroll-unfocused.pages.dev`.

```sh
bun run site:build
```

The build writes `site/dist/`. It uses Bun's built-in Markdown renderer to turn
the repository's `PRIVACY.md` into `/privacy`, keeping the published policy in
sync with the extension. The site has no browser JavaScript, external fonts,
analytics, or runtime dependencies. Screenshots and Lucide artwork come from
the repository's existing assets.

Cloudflare Pages deploys directly from the existing GitHub connection:

| Setting | Value |
| --- | --- |
| Project | `doomscroll-unfocused` |
| Repository | `ikifar2012/doomscroll-unfocused` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `bun run site:build` |
| Output directory | `site/dist` |
| Bun version | `BUN_VERSION=1.4.5` |
| Custom domain | `doomscroll.mstep.dev` |

Site source, privacy text, screenshots/icons, or build dependency changes trigger
production builds. GitHub Actions are used for extension builds/releases only;
the website does not need a deployment Action or GitHub secrets.
