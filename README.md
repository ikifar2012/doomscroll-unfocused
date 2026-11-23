# Doomscroll Unfocused

A small Manifest V3 Chrome extension that aims to prevent Instagram and CNN
videos from pausing when you switch tabs or focus another window.
Written in TypeScript; Chrome loads the compiled JavaScript.

## Open in VS Code (WSL)

```bash
cd /home/mstep/vscode-git-wsl/doomscroll-unfocused
code .
```

Build with Bun 1.4+:

```bash
bun install --frozen-lockfile
bun run build
```

The extension itself has no runtime dependencies. Edit `src/keep-playing.ts`,
then rebuild before reloading the extension in Chrome. Requires Chrome 119+.

## Load in Windows Chrome

1. In the WSL terminal, run `explorer.exe "$(wslpath -w "$PWD/extension")"`.
2. Copy the folder path from Explorer's address bar.
3. Open `chrome://extensions` in Chrome and enable **Developer mode**.
4. Click **Load unpacked** and select that `extension` folder.
5. Refresh any already-open Instagram or CNN tabs, start a video, then switch
   tabs or focus a different window.

If Chrome cannot load from the WSL network path, copy the `extension` folder to
Windows (for example, `C:\Users\YOUR_NAME\Extensions\doomscroll-unfocused`)
and load that copy. Copy updated files again after editing in WSL.

To disable: turn the extension off in `chrome://extensions` and refresh the site.
After code changes, run `bun run build`, click **Reload** on the extension card,
and refresh the site. If you loaded the previous project folder, remove that
extension card and load this project's `extension` folder again.

## How it works

The content script runs at `document_start` in the page's `MAIN` world. It makes
visibility and focus checks report a visible, focused document and suppresses
visibility-change and page-blur events. Blur events from inputs and buttons are
preserved. The script is restricted to HTTPS Instagram and CNN pages, including
their subdomains and matching or origin-inheriting frames. Third-party player
frames on unrelated domains are outside its scope. It has no network
requests, analytics, background worker, or additional API permissions.

Chrome documents these content-script settings here:
https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts

This is a visibility/focus workaround, not a video auto-player. Manual pause and
scrolling away from a video remain under the site's control. It cannot prevent
Chrome from suspending/discarding tabs or override autoplay restrictions. It also
makes the site's activity detection see the tab as focused. Site/player changes
may require adjustments to the workaround.

## Checks and packaging

```bash
bun run check
bun run package
```

The ZIP is written to `dist/doomscroll-unfocused.zip`. Extract it before using
**Load unpacked**. The ZIP contains only the manifest and compiled content script;
Bun and development dependencies are not needed to run the extension.

`bun run check` checks TypeScript types.

Before relying on it, manually check an Instagram Reel, feed video, and CNN video:
start playback, switch tabs, focus another window, pause manually, scroll to
another video, and type in a comment. Compare with the extension disabled
(refresh after toggling). If playback still pauses, record the exact page URL and
whether switching tabs or changing window focus caused it.

## GitHub builds and releases

Pushes to `main` and pull requests run type checking and build a downloadable
extension ZIP. Dependency updates use the shared `ikifar2012/.github` Renovate
preset from `.github/renovate.json`. The Renovate GitHub App must have access to
this repository for updates to run.

To release, update `version` in both `package.json` and `extension/manifest.json`,
commit and push, then publish a GitHub release with a matching tag (for example,
`v0.2.0`). The release workflow checks out that tag, verifies both versions,
builds with Bun, and attaches `doomscroll-unfocused.zip` to the release. It uses
the built-in `GITHUB_TOKEN`; no personal token is needed. Release asset uploads
require mutable releases; if you enable GitHub release immutability, switch to
building and attaching assets to a draft before publishing it.

Chrome Web Store submission is a separate step. See the
[publishing checklist](docs/chrome-web-store.md) for requirements and draft
listing text, and the [privacy policy](PRIVACY.md) for data handling details.
