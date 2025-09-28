//src/middleware/multer.config.ts

import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { createHttpError } from "../utils/error.factory.js";

// --- Generic Image Storage and Filter ---
// This configuration can be reused for all image uploads in your application.
const IMAGE_UPLOADS_DIR = path.join(process.cwd(), "uploads/images_temp");

if (!fs.existsSync(IMAGE_UPLOADS_DIR)) {
  fs.mkdirSync(IMAGE_UPLOADS_DIR, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGE_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `img-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      createHttpError(
        415,
        `File type ${file.mimetype} is not allowed. Please upload a valid image.`
      )
    );
  }
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// --- FIX: A single, clearly named multer instance for all image uploads ---
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
});

// --- Document Upload Configuration (Remains the same) ---
const DOCUMENT_UPLOADS_DIR = path.join(process.cwd(), "uploads/documents_temp");
if (!fs.existsSync(DOCUMENT_UPLOADS_DIR)) {
  fs.mkdirSync(DOCUMENT_UPLOADS_DIR, { recursive: true });
}
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCUMENT_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createHttpError(415, `File type ${file.mimetype} is not allowed.`));
  }
};
const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
});
