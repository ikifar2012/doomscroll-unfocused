import { defaultSites, matchesSite, patternFor, websiteUrl } from "./sites.js";
import type { Request, Response, Site, SiteState } from "./sites.js";

const prefix = "doomscroll-";
let pending: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = pending.then(operation, operation);
  pending = next.catch(() => {});
  return next;
}

async function readSites(): Promise<Site[]> {
  const saved = await chrome.storage.local.get<{ sites?: Site[] }>("sites");
  return saved.sites ?? defaultSites.map((site) => ({ ...site }));
}

async function stateFor(sites: Site[]): Promise<SiteState[]> {
  return Promise.all(sites.map(async (site) => ({
    ...site,
    granted: await chrome.permissions.contains({ origins: [site.pattern] }),
  })));
}

async function syncScripts(sites: Site[]): Promise<void> {
  const existing = (await chrome.scripting.getRegisteredContentScripts())
    .filter((script) => script.id.startsWith(prefix));
  const desired = (await stateFor(sites))
    .filter((site) => site.enabled && site.granted)
    .map((site): chrome.scripting.RegisteredContentScript => ({
      id: `${prefix}${encodeURIComponent(site.pattern)}`,
      matches: [site.pattern],
      js: ["keep-playing.js"],
      runAt: "document_start",
      world: "MAIN",
      allFrames: true,
      matchOriginAsFallback: true,
      persistAcrossSessions: true,
    }));

  const stale = existing.filter((script) => !desired.some((next) => next.id === script.id));
  if (stale.length) {
    await chrome.scripting.unregisterContentScripts({ ids: stale.map((script) => script.id) });
  }
  const updates = desired.filter((script) => existing.some((current) => current.id === script.id));
  const additions = desired.filter((script) => !existing.some((current) => current.id === script.id));
  if (updates.length) await chrome.scripting.updateContentScripts(updates);
  if (additions.length) await chrome.scripting.registerContentScripts(additions);
}

async function saveSites(sites: Site[]): Promise<void> {
  const previous = await readSites();
  await syncScripts(sites);
  try {
    await chrome.storage.local.set({ sites });
  } catch (error) {
    await syncScripts(previous);
    throw error;
  }
}

async function handle(request: Request): Promise<SiteState[]> {
  const sites = await readSites();
  switch (request.type) {
    case "get-sites":
      await syncScripts(sites);
      break;
    case "add-site": {
      const url = websiteUrl(request.url);
      if (!url) throw new Error("Open an HTTP or HTTPS website to add it.");
      const pattern = patternFor(url);
      if (!await chrome.permissions.contains({ origins: [pattern] })) {
        throw new Error("Site access was not granted. Click Add current site to try again.");
      }
      const existing = sites.find((site) => matchesSite(site, url));
      if (existing) existing.enabled = true;
      else sites.push({ pattern, enabled: true });
      await saveSites(sites);
      break;
    }
    case "set-enabled": {
      const site = sites.find((entry) => entry.pattern === request.pattern);
      if (!site || typeof request.enabled !== "boolean") throw new Error("Site settings have changed. Reopen the popup.");
      if (request.enabled && !await chrome.permissions.contains({ origins: [site.pattern] })) {
        throw new Error("Allow access to this site before enabling it.");
      }
      site.enabled = request.enabled;
      await saveSites(sites);
      break;
    }
    case "remove-site": {
      const index = sites.findIndex((site) => site.pattern === request.pattern);
      if (index === -1) throw new Error("This site has already been removed.");
      const [removed] = sites.splice(index, 1);
      await saveSites(sites);
      // A re-added subdomain can also be covered by a required default-site grant.
      const removedUrl = websiteUrl(removed!.pattern.replace("*.", ""));
      const required: string[] = chrome.runtime.getManifest().host_permissions ?? [];
      const requiredAccess = removedUrl && required.some((pattern) => matchesSite({ pattern, enabled: true }, removedUrl));
      if (!requiredAccess) {
        await chrome.permissions.remove({ origins: [removed!.pattern] });
      }
      break;
    }
    default:
      throw new Error("Unknown settings request.");
  }
  return stateFor(sites);
}

chrome.runtime.onMessage.addListener((request: Request, sender, sendResponse: (response: Response) => void) => {
  if (sender.id !== chrome.runtime.id) return false;
  serialize(() => handle(request)).then(
    (sites) => sendResponse({ ok: true, sites }),
    (error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Could not save settings. Try again." }),
  );
  return true;
});

async function initialize(): Promise<void> {
  await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  const sites = await readSites();
  await syncScripts(sites);
  await chrome.storage.local.set({ sites });
}

const report = (error: unknown) => console.error("Could not update site settings", error);
chrome.runtime.onInstalled.addListener(() => { void serialize(initialize).catch(report); });
chrome.runtime.onStartup.addListener(() => { void serialize(initialize).catch(report); });
chrome.permissions.onAdded.addListener(() => { void serialize(async () => syncScripts(await readSites())).catch(report); });
chrome.permissions.onRemoved.addListener(() => { void serialize(async () => syncScripts(await readSites())).catch(report); });
