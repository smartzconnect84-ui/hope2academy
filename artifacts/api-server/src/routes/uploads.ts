import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router, type Request } from "express";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
const MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), "uploads");
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf", "video/mp4", "video/webm",
]);

type MultipartFile = { filename: string; contentType: string; data: Buffer };

function parseMultipart(req: Request): Promise<MultipartFile> {
  return new Promise((resolve, reject) => {
    const contentType = String(req.headers["content-type"] ?? "");
    const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!match) {
      reject(new Error("multipart/form-data with a boundary is required"));
      return;
    }
    const boundary = `--${match[1] ?? match[2]}`;
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BYTES + 1024 * 1024) {
        reject(new Error("File is larger than 10 MB"));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    req.on("error", reject);
    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks);
        const delimiter = Buffer.from(`\r\n${boundary}`);
        const first = body.indexOf(Buffer.from(`${boundary}\r\n`));
        if (first < 0) throw new Error("No file was attached");
        const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), first);
        if (headerEnd < 0) throw new Error("Invalid multipart payload");
        const headers = body.subarray(first, headerEnd).toString("utf8");
        const disposition = headers.match(/filename="([^"]*)"/i);
        const type = headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
        if (!disposition?.[1] || !type) throw new Error("A named file is required");
        const contentStart = headerEnd + 4;
        const contentEnd = body.indexOf(delimiter, contentStart);
        if (contentEnd < 0) throw new Error("Invalid multipart terminator");
        const data = body.subarray(contentStart, contentEnd);
        if (!data.length) throw new Error("The attached file is empty");
        if (data.length > MAX_BYTES) throw new Error("File is larger than 10 MB");
        if (!ALLOWED_TYPES.has(type)) throw new Error("Unsupported file type");
        resolve({ filename: disposition[1], contentType: type, data });
      } catch (error) {
        reject(error);
      }
    });
  });
}

function extension(filename: string, contentType: string) {
  const fromName = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  if (fromName && fromName.length <= 8) return fromName;
  const byType: Record<string, string> = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif",
    "image/webp": ".webp", "image/svg+xml": ".svg", "application/pdf": ".pdf",
    "video/mp4": ".mp4", "video/webm": ".webm",
  };
  return byType[contentType] ?? "";
}

router.post("/uploads", requireAuth, async (req, res) => {
  try {
    const file = await parseMultipart(req);
    await mkdir(UPLOAD_DIR, { recursive: true });
    const id = `${randomUUID()}${extension(file.filename, file.contentType)}`;
    await writeFile(path.join(UPLOAD_DIR, id), file.data, { flag: "wx" });
    res.status(201).json({
      objectPath: `/uploads/${id}`,
      url: `/uploads/${id}`,
      name: file.filename,
      type: file.contentType,
      size: file.data.length,
    });
  } catch (error: any) {
    const message = error?.message ?? "Upload failed";
    res.status(message.includes("larger") ? 413 : 400).json({ error: message });
  }
});

router.get("/uploads/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/i.test(id)) {
    res.status(400).json({ error: "Invalid file path" });
    return;
  }
  try {
    const filePath = path.join(UPLOAD_DIR, id);
    const data = await readFile(filePath);
    const ext = path.extname(id).toLowerCase();
    const contentType = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
      ".pdf": "application/pdf", ".mp4": "video/mp4", ".webm": "video/webm",
    }[ext] ?? "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(data);
  } catch {
    res.status(404).json({ error: "File not found" });
  }
});

export default router;