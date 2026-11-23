import { isXHost, matchesSite, patternFor, siteLabel, websiteUrl } from "./sites.js";
import type { Request, Response, SiteState } from "./sites.js";

function element<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const host = element("current-host");
const status = element("current-status");
const control = element("current-control");
const toggle = element<HTMLInputElement>("current-toggle");
const scrollToggle = element<HTMLInputElement>("scroll-toggle");
const playbackDetails = element<HTMLButtonElement>("playback-details");
const add = element<HTMLButtonElement>("add-current");
const list = element<HTMLUListElement>("sites");
const notice = element("notice");
const refresh = element<HTMLButtonElement>("refresh");
let sites: SiteState[] = [];
let currentUrl: URL | undefined;
let tabId: number | undefined;
let busy = true;

async function request(message: Request): Promise<void> {
  const response: Response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || "Could not load site settings. Reopen the popup to try again.");
  sites = response.sites;
}

function showNotice(text: string, error = false, canRefresh = false): void {
  notice.hidden = false;
  notice.dataset.error = String(error);
  element("notice-text").textContent = text;
  refresh.hidden = !canRefresh || tabId === undefined;
}

function setBusy(value: boolean): void {
  busy = value;
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input").forEach((item) => {
    item.disabled = value;
  });
}

async function change(action: () => Promise<boolean>, affectsCurrent: boolean): Promise<void> {
  if (busy) return;
  const focused = document.activeElement as HTMLElement | null;
  const focusKey = focused?.dataset.focusKey;
  const focusId = focused?.id;
  setBusy(true);
  try {
    if (await action()) {
      showNotice(
        affectsCurrent ? "Saved. Refresh this tab to apply." : "Saved. Refresh any open tabs on that site to apply.",
        false,
        affectsCurrent,
      );
    } else {
      showNotice("Site access wasn’t granted. Your settings haven’t changed.");
    }
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Could not save settings. Try again.", true);
    // Recover the actual state if Chrome or the worker failed mid-operation.
    try { await request({ type: "get-sites" }); } catch { /* Keep the last known state. */ }
  } finally {
    render();
    setBusy(false);
    const restore = focusKey
      ? [...document.querySelectorAll<HTMLElement>("[data-focus-key]")].find((item) => item.dataset.focusKey === focusKey)
      : focusId ? document.getElementById(focusId) : undefined;
    if (restore && !restore.closest("[hidden]")) restore.focus();
    else if (!control.hidden) toggle.focus();
    else if (!add.hidden) add.focus();
    else list.querySelector<HTMLInputElement>("input")?.focus();
  }
}

function setEnabled(site: SiteState, enabled: boolean): void {
  void change(async () => {
    // Request directly in the click/change gesture, before any async work.
    if (enabled && !site.granted && !await chrome.permissions.request({ origins: [site.pattern] })) return false;
    await request({ type: "set-enabled", pattern: site.pattern, enabled });
    return true;
  }, Boolean(currentUrl && matchesSite(site, currentUrl)));
}

function render(): void {
  const current = currentUrl && sites.find((site) => matchesSite(site, currentUrl!));
  host.textContent = currentUrl?.hostname || "Open a website";
  control.hidden = !current;
  add.hidden = !currentUrl || Boolean(current);
  element("access-note").hidden = add.hidden;
  element("scroll-option").hidden = !current || !currentUrl || !isXHost(currentUrl.hostname);
  scrollToggle.checked = current?.blockScrollPause === true;
  playbackDetails.hidden = !(current?.blockScrollPause && current.enabled && current.granted);
  element("playback-report").hidden = true;
  element("scroll-description").textContent = current && !current.enabled
    ? "Enable this site above to apply this option. Off by default."
    : "X only. Keep the current video playing when it leaves the screen. Off by default.";
  scrollToggle.onchange = () => {
    if (!current) return;
    void change(async () => {
      await request({ type: "set-scroll-pause", pattern: current.pattern, enabled: scrollToggle.checked });
      return true;
    }, true);
  };

  if (current) {
    toggle.checked = current.enabled && current.granted;
    toggle.setAttribute("aria-label", `Keep playing on ${siteLabel(current.pattern)}`);
    status.textContent = !current.granted
      ? "Site access needed. Enable to allow access."
      : current.enabled ? "Enabled. Keep playing when you switch away." : "Disabled. This site controls playback.";
    toggle.onchange = () => setEnabled(current, toggle.checked);
  } else {
    status.textContent = currentUrl
      ? "Keep playing when you switch away from this site."
      : "Switch to a regular website to add it. Saved sites can still be managed below.";
  }

  list.replaceChildren();
  element("empty").hidden = sites.length > 0;
  for (const site of sites) {
    const label = siteLabel(site.pattern);
    const row = document.createElement("li");
    row.className = "site";
    const name = document.createElement("div");
    name.className = "site-name";
    const domain = document.createElement("p");
    domain.className = "site-domain";
    domain.textContent = label;
    const detail = document.createElement("p");
    detail.className = "site-detail";
    const scope = site.pattern.includes("://*.") ? "Includes subdomains" : "This domain only";
    const protocol = site.pattern.startsWith("http:") ? "HTTP" : "HTTPS";
    detail.textContent = site.granted ? `${scope} · ${protocol}` : "Site access needed";
    name.append(domain, detail);

    const switchLabel = document.createElement("label");
    switchLabel.className = "switch";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("role", "switch");
    checkbox.setAttribute("aria-label", `Keep playing on ${label} (${protocol})`);
    checkbox.dataset.focusKey = `toggle:${site.pattern}`;
    checkbox.checked = site.enabled && site.granted;
    checkbox.onchange = () => setEnabled(site, checkbox.checked);
    const track = document.createElement("span");
    track.className = "track";
    track.setAttribute("aria-hidden", "true");
    switchLabel.append(checkbox, track);

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "×";
    remove.title = `Remove ${label}`;
    remove.setAttribute("aria-label", `Remove ${label} (${protocol})`);
    remove.dataset.focusKey = `remove:${site.pattern}`;
    remove.onclick = () => {
      void change(async () => {
        await request({ type: "remove-site", pattern: site.pattern });
        return true;
      }, Boolean(currentUrl && matchesSite(site, currentUrl)));
    };
    row.append(name, switchLabel, remove);
    list.append(row);
  }
}

add.onclick = () => {
  if (!currentUrl) return;
  const url = currentUrl;
  void change(async () => {
    if (!await chrome.permissions.request({ origins: [patternFor(url)] })) return false;
    await request({ type: "add-site", url: url.origin });
    return true;
  }, true);
};

playbackDetails.onclick = async () => {
  if (tabId === undefined || busy) return;
  setBusy(true);
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        const read = (window as Window & { __doomscrollPlaybackReport?: () => unknown }).__doomscrollPlaybackReport;
        return typeof read === "function" ? read() : null;
      },
    });
    if (!result?.result) {
      showNotice("Refresh X, reproduce the pause, then open Playback details again.", false, true);
      return;
    }
    const output = element<HTMLTextAreaElement>("playback-output");
    output.value = JSON.stringify({ extensionVersion: chrome.runtime.getManifest().version, ...result.result }, null, 2);
    element("playback-report").hidden = false;
    output.focus();
    output.select();
  } catch {
    showNotice("Could not read playback details. Open the X tab and try again.", true);
  } finally {
    setBusy(false);
  }
};

refresh.onclick = async () => {
  if (tabId === undefined || busy) return;
  setBusy(true);
  try {
    await chrome.tabs.reload(tabId);
    window.close();
  } catch {
    showNotice("Could not refresh this tab. Refresh it in Chrome to apply your changes.", true);
    setBusy(false);
  }
};

async function initialize(): Promise<void> {
  setBusy(true);
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = websiteUrl(tab?.url);
    tabId = tab?.id;
    await request({ type: "get-sites" });
    render();
    setBusy(false);
  } catch (error) {
    host.textContent = "Settings unavailable";
    status.textContent = "Close and reopen the popup to try again.";
    showNotice(error instanceof Error ? error.message : "Could not load settings.", true);
  }
}

void initialize();
