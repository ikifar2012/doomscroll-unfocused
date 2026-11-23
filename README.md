# Doomscroll Unfocused

Keep Instagram and CNN playing when you switch tabs or windows.

Doomscroll Unfocused is a Chrome extension that blocks the visibility and focus
signals sites use to pause playback when you switch away. Start a video, then
get on with whatever else you were doing.

## Install

Requires Chrome 119 or newer. To build from source, install [Bun](https://bun.sh)
1.4 or newer, then run:

```sh
git clone https://github.com/ikifar2012/doomscroll-unfocused.git
cd doomscroll-unfocused
bun install --frozen-lockfile
bun run build
```

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `extension` folder.
3. Refresh Instagram or CNN and start playback.

Published [GitHub releases](https://github.com/ikifar2012/doomscroll-unfocused/releases)
include a prebuilt `doomscroll-unfocused.zip`. Extract it and load the extracted
folder using the same steps; no build tools are needed.

To turn it off, disable the extension and refresh the site.

## How it works

A content script runs before the site's scripts, makes the document report itself
as visible and focused, and stops page visibility-change and blur events from
reaching the site's listeners. Inputs and buttons still receive normal blur events.

It runs only on Instagram and CNN. It does not collect data, make network requests,
or load remote code. See the [privacy policy](PRIVACY.md).

## Limitations

This is a focus-loss workaround. It does not start videos automatically, prevent
Chrome from suspending tabs, or override pauses caused by scrolling away from a
video. It also makes the site's activity checks see the tab as focused.

Compatibility with the live players still needs verification. If a video pauses
when you switch away, [open an issue](https://github.com/ikifar2012/doomscroll-unfocused/issues)
with the page URL and steps to reproduce it.

## Development

Edit `src/keep-playing.ts`, rebuild, reload the extension in `chrome://extensions`,
and refresh the site.

```sh
bun run build    # Compile the extension
bun run check    # Check TypeScript types
bun run package  # Build dist/doomscroll-unfocused.zip
```

Pushes and pull requests build the extension through GitHub Actions. To publish a
GitHub release, match the tag to the version in `package.json` and
`extension/manifest.json` (for example, `v0.2.0`). The release workflow builds and
attaches the ZIP.

For Chrome Web Store requirements, see the [publishing guide](docs/chrome-web-store.md).

Icon: [Circle Fading Play](https://lucide.dev/icons/circle-fading-play) by
Lucide contributors, used under the [included license](extension/THIRD_PARTY_NOTICES.txt).
