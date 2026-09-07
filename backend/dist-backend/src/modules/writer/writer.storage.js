import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../common/errors/http-error.js";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const storageRoot = path.resolve(process.cwd(), "backend", ".writer-storage");
const signatures = {
    "image/jpeg": (data) => data.length > 2 && data[0] === 0xff && data[1] === 0xd8,
    "image/png": (data) => data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/webp": (data) => data.subarray(0, 4).toString("ascii") === "RIFF" &&
        data.subarray(8, 12).toString("ascii") === "WEBP",
};
export const storeWriterImage = async (mimeType, data) => {
    if (!signatures[mimeType]) {
        throw new AppError(400, "INVALID_IMAGE", "Only JPEG, PNG, and WebP images are supported.");
    }
    if (data.length === 0 || data.length > MAX_IMAGE_BYTES) {
        throw new AppError(413, "IMAGE_TOO_LARGE", "Image must be between 1 byte and 10 MB.");
    }
    if (!signatures[mimeType](data)) {
        throw new AppError(400, "INVALID_IMAGE", "The uploaded file does not match its image type.");
    }
    const storageKey = `writer/${randomUUID()}`;
    const filePath = path.join(storageRoot, storageKey);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data, { flag: "wx" });
    return { storageKey, sizeBytes: data.length };
};
export const readWriterImage = async (storageKey) => {
    if (!/^writer\/[0-9a-f-]+$/i.test(storageKey)) {
        throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
    }
    try {
        return await readFile(path.join(storageRoot, storageKey));
    }
    catch {
        throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
    }
};
