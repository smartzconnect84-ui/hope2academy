---
name: Object storage fallback
description: App Storage provisioning may be unavailable; retain the authenticated multipart upload route as the working file-upload path.
---

When persistent file uploads are requested, try App Storage first, but keep the existing authenticated multipart endpoint when provisioning is unavailable.

**Why:** The workspace's App Storage setup returned an internal provisioning failure, while the existing API upload route remained functional and already handled file type, size, and authentication checks.

**How to apply:** Do not remove or replace the working multipart route until App Storage is confirmed available; keep UI uploads attachment-first and store returned serving paths rather than user-entered image URLs.