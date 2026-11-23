# Privacy policy

Doomscroll Unfocused runs locally in your browser on the sites you enable.
Instagram and CNN are enabled by default; you can disable or remove them.
It changes the visibility and focus signals delivered to those pages to help
prevent playback from pausing when you switch tabs or windows.

The extension saves your chosen site domains and their enabled/disabled settings
and the optional X scroll-pause preference in Chrome's local extension storage.
The X option is off unless you explicitly select it. These preferences stay on your device and
are not synced or sent to the developer or other parties. Removing a site deletes
its saved preference. Uninstalling the extension removes its local settings.

When you open the toolbar popup, the extension reads the current tab's URL to
identify its domain and offer site controls. It does not save the full URL, page
paths, query strings, or a history of visited pages.

The extension does not collect or transmit page content, account information, or
usage analytics. It does not sell or share your data, read cookies, send network
requests, connect to a developer-operated server, or download remote code.

The extension inspects event targets only to distinguish a page losing focus from
an input or button losing focus. Those event targets are not recorded or sent
anywhere. Sites continue to operate under their own privacy policies; this
extension makes their visibility and focus checks see the page as active.

When the X scroll-pause option is enabled, the extension also checks the active
video's viewport position and briefly recognizes player clicks, pause keys, and
Media Session pause actions so that manual pausing remains possible. It does not
record or transmit those interactions, video content, or positions.

For troubleshooting, the X script keeps up to 20 playback-status events in the
current page's memory, such as pause, source reset, and player removal. Playback
details show these events and the current player's connection, buffering, and
error state only when requested. They contain no URLs, post text, account details,
or interaction history, are not sent anywhere, and are discarded on page reload.

Site access is requested when you add a domain. Disabling a site stops future
script injection but keeps its preference and permission so it can be re-enabled.
Removing a custom site also releases its optional permission. The default
Instagram/CNN host permissions are declared at installation and can be managed
through Chrome's extension settings. Existing pages must be refreshed after
settings changes to apply or remove the behavior.

Questions about the extension can be raised through
[GitHub Issues](https://github.com/ikifar2012/doomscroll-unfocused/issues).
Do not include private account information in a public issue.
