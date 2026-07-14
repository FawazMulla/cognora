import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/jpeg", "image/png", "image/webp"];

export const uploadInitSchema = z.object({
  filename: z.string().min(1),
  fileType: z.enum([
    "application/pdf", 
    "application/vnd.ms-powerpoint", 
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", 
    "image/jpeg", 
    "image/png", 
    "image/webp"
  ]),
  sizeBytes: z.number().max(MAX_FILE_SIZE, "File size must be less than 50MB"),
  sha256Hash: z.string().length(64, "Invalid SHA-256 hash"),
  subjectId: z.string().uuid(),
});
