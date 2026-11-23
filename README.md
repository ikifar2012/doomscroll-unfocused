# Doomscroll Unfocused

Keep videos playing when you switch tabs or windows.

Doomscroll Unfocused is a Chrome extension that blocks the visibility and focus
signals sites use to pause playback when you switch away. Start a video, then
get on with whatever else you were doing.

Instagram and CNN are enabled by default. Use the toolbar popup to toggle each
site, add the website you're viewing, or remove saved domains.

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

## Site controls

Click the extension's toolbar icon to open the popup. It follows your browser's
light or dark appearance automatically.

- Toggle the current site on or off.
- Click **Add current site** to enable another domain. Chrome asks for access
  to that domain when needed; other websites remain untouched. Custom entries
  cover the exact hostname and HTTP/HTTPS scheme you add, without subdomains.
- Manage saved sites with their switches and remove buttons. The default
  Instagram/CNN entries include their subdomains.

Refresh open tabs after changing their settings. The popup provides a **Refresh
tab** button when the current site changes. Disabling keeps a site's settings;
removing a custom site also releases its optional access permission.

Chrome's internal pages and the Chrome Web Store cannot be added. Site settings
are saved locally on your device.

### X: keep playing while scrolling

Add `x.com` from its tab, then choose **Keep playing while scrolling** in the
popup and refresh the tab. This separate option is **off by default**, including
when you first add X. X itself is not enabled or granted access by default.
The same option is available on legacy `twitter.com` domains.

It guards against automatic pause calls when the current video leaves the
viewport and keeps that playback protected when it comes back into view.
Manual player controls, keyboard pause, and Media Session pause controls
remain available. Other feed videos cannot take over through autoplay; explicitly
starting another video replaces the previous one.
If X removes a player from the timeline, the extension cannot keep it alive.

## How it works

A content script runs before the site's scripts, makes the document report itself
as visible and focused, and stops page visibility-change and blur events from
reaching the site's listeners. Inputs and buttons still receive normal blur events.

It runs only on enabled sites where you have allowed access. A service worker
maintains saved script registrations so injection still runs at page load while
the worker is asleep. The extension stores your site preferences locally and
does not send data anywhere or load remote code. See the [privacy policy](PRIVACY.md).

## Limitations

This is a focus-loss workaround. It does not start videos automatically, prevent
Chrome from suspending tabs, or generally override scroll-related pauses outside
the optional X feature. It also makes the site's activity checks see the tab as focused.

Compatibility with the live players still needs verification. If a video pauses
when you switch away, [open an issue](https://github.com/ikifar2012/doomscroll-unfocused/issues)
with the page URL and steps to reproduce it.

## Development

The content script is in `src/keep-playing.ts`, site registration is in
`src/background.ts`, and the popup is in `src/popup.ts` and `extension/popup.*`.
After editing, rebuild, reload the extension in `chrome://extensions`, and
refresh the site.

```sh
bun run build    # Compile the extension
bun run check    # Check TypeScript types
bun run package  # Build dist/doomscroll-unfocused.zip
```

Pushes and pull requests build the extension through GitHub Actions. To publish a
GitHub release, match the tag to the version in `package.json` and
`extension/manifest.json` (for example, `v0.4.0`). The release workflow builds and
attaches the ZIP.

For Chrome Web Store requirements, see the [publishing guide](docs/chrome-web-store.md).

Icon: [Circle Fading Play](https://lucide.dev/icons/circle-fading-play) by
Lucide contributors, used under the [included license](extension/THIRD_PARTY_NOTICES.txt).
