export interface Site {
  pattern: string;
  enabled: boolean;
}

export interface SiteState extends Site {
  granted: boolean;
}

export type Request =
  | { type: "get-sites" }
  | { type: "add-site"; url: string }
  | { type: "set-enabled"; pattern: string; enabled: boolean }
  | { type: "remove-site"; pattern: string };

export type Response =
  | { ok: true; sites: SiteState[] }
  | { ok: false; error: string };

export const defaultSites: Site[] = [
  { pattern: "https://*.instagram.com/*", enabled: true },
  { pattern: "https://*.cnn.com/*", enabled: true },
];

export function websiteUrl(value: string | undefined): URL | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    if (url.hostname === "chromewebstore.google.com") return;
    if (url.hostname === "chrome.google.com" && url.pathname.startsWith("/webstore")) return;
    return url;
  } catch {
    return;
  }
}

export function patternFor(url: URL): string {
  // Chrome host match patterns cover all ports; never save paths or query strings.
  return `${url.protocol}//${url.hostname}/*`;
}

export function siteLabel(pattern: string): string {
  return pattern.replace(/^https?:\/\//, "").replace(/\/\*$/, "").replace(/^\*\./, "");
}

export function matchesSite(site: Site, url: URL): boolean {
  const [scheme, host] = site.pattern.replace(/\/\*$/, "").split("://");
  if (`${scheme}:` !== url.protocol || !host) return false;
  if (!host.startsWith("*.")) return host === url.hostname;
  const root = host.slice(2);
  return url.hostname === root || url.hostname.endsWith(`.${root}`);
}
