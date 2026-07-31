/**
 * content-sync.ts — bridges the public-website content stores with the backend API.
 *
 * Public site content (brand, hero slides, team, site content) is stored server-side
 * in the `sitecontent` collection as singleton documents keyed by a stable id.
 * Reads are public (any visitor), writes require an authenticated Admin/Superadmin
 * session — exactly the roles that can edit content in the portal.
 *
 * Local storage stays as an offline cache / fallback so the site keeps working when
 * the API server is not reachable.
 */
import { apiClient, isNetworkError } from "./api-client";

export const CONTENT_COLLECTION = "sitecontent";

export type ContentDocId = "brand" | "hero" | "team" | "site";

interface ContentDoc<T = unknown> {
  id: ContentDocId;
  data: T;
  updatedAt?: string;
}

let cachedDocs: Promise<Record<string, unknown> | null> | null = null;

/** Fetch every published content document once per page load. */
export async function pullAllDocs(): Promise<Record<string, unknown> | null> {
  if (!cachedDocs) {
    cachedDocs = (async () => {
      try {
        const rows = await apiClient.list<ContentDoc>(CONTENT_COLLECTION);
        const out: Record<string, unknown> = {};
        for (const r of rows) if (r && r.id) out[r.id] = r.data;
        return out;
      } catch (e) {
        if (isNetworkError(e)) return null;
        return null;
      }
    })();
  }
  return cachedDocs;
}

/** Fetch a single published content document (null when unavailable/unpublished). */
export async function pullDoc<T>(id: ContentDocId): Promise<T | null> {
  const all = await pullAllDocs();
  if (!all || !(id in all)) return null;
  return all[id] as T;
}

/** Publish a content document. No-op for anonymous visitors. */
export function pushDoc(id: ContentDocId, data: unknown): void {
  if (!apiClient.getToken()) return;
  const body = { id, data, updatedAt: new Date().toISOString() };
  void (async () => {
    try {
      await apiClient.update(CONTENT_COLLECTION, id, body);
    } catch {
      try {
        await apiClient.create(CONTENT_COLLECTION, body);
      } catch {
        /* offline — localStorage keeps the change */
      }
    }
  })();
}
