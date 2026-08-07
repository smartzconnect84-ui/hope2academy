---
name: Bundled brand assets
description: Core brand imagery must remain available in local development and preview environments.
---

Core brand assets such as logos and favicons should be bundled locally rather than relying on legacy CDN-style `/__l5e/` asset paths. Existing persisted brand settings may still contain those paths, so readers should treat them as stale and fall back to the bundled asset.

**Why:** The legacy asset URL was unavailable in the live preview, producing a broken header logo even though the rest of the site loaded normally.

**How to apply:** For required identity assets, keep a local file under the app's source/public assets and add a small migration or fallback when reading persisted settings from older versions.