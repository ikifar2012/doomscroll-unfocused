# Chrome Web Store publishing

Requirements checked against Google's official documentation on November 22, 2026.
The GitHub workflows produce a downloadable ZIP. They do not upload or submit
the extension to the Chrome Web Store.

## What is still needed

- Register a Chrome Web Store developer account, agree to the terms, pay the
  one-time registration fee, and finish the dashboard's account verification
  requirements. Google requires 2-Step Verification before publishing or updating.
  The registration screen confirms the applicable fee.
- Upload the supplied [light](../assets/store/screenshot-light.png) and
  [dark](../assets/store/screenshot-dark.png) screenshots. Both are 1280x800,
  24-bit RGB PNGs with no transparency. Up to five screenshots are supported.
  Promotional tiles (440x280 and 1400x560) are optional.
- Finish the listing: name, detailed description, category, language, support
  information, and distribution choices.
- Complete the Privacy practices tab with the single purpose, justification for
  site access, remote-code declaration, and accurate data disclosures. Review the
  included [privacy policy](../PRIVACY.md) and use its public repository URL in
  the dashboard where appropriate.
- Verify playback on the live Instagram and CNN players, including tab switching,
  another focused window, manual pause, scrolling away, and form controls. No
  successful live-player verification has been recorded yet.

The package includes a 128x128 PNG store icon and 16/32/48 variants, declared in
the manifest. They use Lucide's Circle Fading Play artwork with its license
included in the ZIP. Store screenshots are available in `assets/store/`.
Account setup, listing fields, and live verification still need completion.

## Suggested listing text

**Name:** Doomscroll Unfocused

**Summary:** Keep videos playing when you switch tabs. Enable it per site, with Instagram and CNN included.

**Description:**

Keep listening while you move to another tab or window. Doomscroll Unfocused
adjusts page visibility and focus signals to help prevent players from pausing
when you switch away. Instagram and CNN are enabled by default. Use the toolbar
popup to enable, disable, add, and remove sites.
On X, users can separately opt into keeping videos playing as they scroll out of
view. This option is off by default and requires adding the site first.

Start playback yourself. The extension does not force videos to play, bypass
autoplay rules, or stop Chrome from suspending tabs. Refresh open tabs after
changing site settings. Website changes may affect compatibility.

Site preferences are stored locally. No analytics, tracking, or external
services. Not affiliated with Instagram, Meta, or CNN.

**Single purpose:** Prevent visibility- and focus-triggered playback pauses on
user-selected sites when the user switches tabs or windows.

**Permissions justification:**

- `activeTab`: identify the domain of the current tab when the user opens the
  toolbar popup, so the popup can show its settings and offer to add it.
- `scripting`: register or unregister the bundled playback content script for
  enabled sites, running before the page's scripts.
- `storage`: save manually chosen domains and their enabled states locally.
- Required Instagram/CNN host access: provide the default sites, including
  subdomains and matching or origin-inheriting player frames.
- Optional `http://*/*` and `https://*/*` host declarations: allow users to add
  domains at runtime. The popup requests only the selected domain's match pattern
  after an explicit user action; these declarations do not grant all-site access.

**Remote code:** No. The executable script is bundled in the extension ZIP.

**Data handling:** The extension stores manually chosen domains and enabled
states locally, and reads the current tab's URL when the popup opens. It does not
save full URLs or browsing history and does not transmit settings or browsing
data. It locally inspects event targets to preserve input/button blur behavior,
without recording them. Disclose this local handling accurately in the dashboard;
local-only processing is still subject to Google's disclosure requirements.
Review the included privacy policy and dashboard certifications against the
actual submitted version.

The optional X feature also inspects video viewport bounds and recognizes player
clicks, pause keys, and Media Session pause actions locally, without recording or
transmitting them. Include this behavior in the reviewer's instructions and
verify it on the live X player before submitting.

**Support:** https://github.com/ikifar2012/doomscroll-unfocused/issues

**Privacy policy:** https://github.com/ikifar2012/doomscroll-unfocused/blob/main/PRIVACY.md

## Upload and submit

1. Finish the missing assets and live checks above.
2. Increase `version` in both `extension/manifest.json` and `package.json` for
   each update. Chrome requires the uploaded version to increase.
3. Run `bun install --frozen-lockfile`, `bun run check`, and `bun run package`.
4. Upload `dist/doomscroll-unfocused.zip` through **New item** in the developer
   dashboard. Its `manifest.json` is at the ZIP root, as required.
5. Complete Store listing, Privacy practices, Distribution, and any reviewer
   instructions. Provide reviewer access instructions if login is needed; never
   put passwords or account credentials in this public repository.
6. Submit for review. Choose automatic publishing after approval or deferred
   publishing. Approval and review timing are controlled by Google.

For later automation, the Chrome Web Store API can upload versions and submit
them after the initial dashboard setup. This project does not configure store
credentials or automatic store submissions.

## Official sources

- [Developer registration](https://developer.chrome.com/docs/webstore/register)
- [2-Step Verification](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification)
- [Package preparation](https://developer.chrome.com/docs/webstore/prepare)
- [Icon and screenshot requirements](https://developer.chrome.com/docs/webstore/images)
- [Listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Privacy declarations](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Upload and review](https://developer.chrome.com/docs/webstore/publish)
