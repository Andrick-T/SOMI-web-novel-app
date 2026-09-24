import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../common/errors/http-error.js";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const storageRoot = path.resolve(process.cwd(), "backend", ".writer-storage");

const signatures: Record<string, (data: Buffer) => boolean> = {
  "image/jpeg": (data) =>
    data.length > 2 && data[0] === 0xff && data[1] === 0xd8,
  "image/png": (data) =>
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  "image/webp": (data) =>
    data.subarray(0, 4).toString("ascii") === "RIFF" &&
    data.subarray(8, 12).toString("ascii") === "WEBP",
};

export const storeWriterImage = async (mimeType: string, data: Buffer) => {
  if (!signatures[mimeType]) {
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "Only JPEG, PNG, and WebP images are supported.",
    );
  }
  if (data.length === 0 || data.length > MAX_IMAGE_BYTES) {
    throw new AppError(
      413,
      "IMAGE_TOO_LARGE",
      "Image must be between 1 byte and 10 MB.",
    );
  }
  if (!signatures[mimeType](data)) {
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "The uploaded file does not match its image type.",
    );
  }

  const storageKey = `writer/${randomUUID()}`;
  const filePath = path.join(storageRoot, storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data, { flag: "wx" });
  return { storageKey, sizeBytes: data.length };
};

export const readWriterImage = async (storageKey: string) => {
  if (!/^writer\/[0-9a-f-]+$/i.test(storageKey)) {
    throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
  }
  try {
    return await readFile(path.join(storageRoot, storageKey));
  } catch {
    throw new AppError(404, "ASSET_NOT_FOUND", "Asset not found.");
  }
};


const MAX_KYC_DOCUMENT_BYTES = 10 * 1024 * 1024;

const kycSignatures: Record<string, (data: Buffer) => boolean> = {
  "application/pdf": (data) =>
    data.subarray(0, 5).toString("ascii") === "%PDF-",
  "image/jpeg": (data) =>
    data.length > 2 && data[0] === 0xff && data[1] === 0xd8,
  "image/png": (data) =>
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  "image/webp": (data) =>
    data.subarray(0, 4).toString("ascii") === "RIFF" &&
    data.subarray(8, 12).toString("ascii") === "WEBP",
};

export const storeWriterKycDocument = async (
  mimeType: string,
  data: Buffer,
) => {
  if (!kycSignatures[mimeType]) {
    throw new AppError(
      400,
      "INVALID_KYC_DOCUMENT",
      "KYC documents must be PDF, JPEG, PNG, or WebP.",
    );
  }

  if (data.length === 0 || data.length > MAX_KYC_DOCUMENT_BYTES) {
    throw new AppError(
      413,
      "KYC_DOCUMENT_TOO_LARGE",
      "KYC documents must be between 1 byte and 10 MB.",
    );
  }

  if (!kycSignatures[mimeType](data)) {
    throw new AppError(
      400,
      "INVALID_KYC_DOCUMENT",
      "The uploaded file does not match its document type.",
    );
  }

  const storageKey = `kyc/${randomUUID()}`;
  const filePath = path.join(storageRoot, storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data, { flag: "wx" });

  return { storageKey, sizeBytes: data.length };
};

export const readWriterKycDocument = async (storageKey: string) => {
  if (!/^kyc\/[0-9a-f-]+$/i.test(storageKey)) {
    throw new AppError(404, "KYC_DOCUMENT_NOT_FOUND", "KYC document not found.");
  }

  try {
    return await readFile(path.join(storageRoot, storageKey));
  } catch {
    throw new AppError(404, "KYC_DOCUMENT_NOT_FOUND", "KYC document not found.");
  }
};
