"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./requests";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_BUCKET = "request-photos";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic"] as const;

// Signed URL expires in 60 seconds — enough time to complete the upload.
const UPLOAD_URL_EXPIRY_SECONDS = 60;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const getUploadUrlSchema = z.object({
  hotelId: z.string().uuid("Invalid hotel ID"),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
  }),
  extension: z.enum(ALLOWED_EXTENSIONS, {
    error: `File extension not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
  }),
  fileSizeBytes: z
    .number()
    .int("File size must be an integer")
    .min(1, "File size must be greater than 0")
    .max(MAX_FILE_SIZE_BYTES, "File exceeds maximum size of 10 MB"),
});

const deleteUploadSchema = z.object({
  path: z
    .string()
    .min(1, "Path is required")
    .max(500, "Path is too long")
    .refine(
      (p) => !p.includes(".."),
      { message: "Path contains invalid characters" }
    ),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildStoragePath(hotelId: string, userId: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `request-photos/${hotelId}/${userId}/${timestamp}-${random}.${extension}`;
}

function getPublicUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

// ---------------------------------------------------------------------------
// getUploadUrl  (INN-133)
// ---------------------------------------------------------------------------
//
// Generates a signed Supabase Storage upload URL. The caller must then PUT
// the file directly to the returned uploadUrl within UPLOAD_URL_EXPIRY_SECONDS.
//
// Returns: { uploadUrl, publicUrl, path }

export async function getUploadUrl(
  input: z.input<typeof getUploadUrlSchema>
): Promise<ActionResult<{ uploadUrl: string; publicUrl: string; path: string }>> {
  const parsed = getUploadUrlSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { hotelId, extension } = parsed.data;
    const storagePath = buildStoragePath(hotelId, user.id, extension);

    const { data, error: signError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (signError || !data) {
      return { success: false, error: "Failed to generate upload URL" };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const publicUrl = getPublicUrl(supabaseUrl, storagePath);

    return {
      success: true,
      data: {
        uploadUrl: data.signedUrl,
        publicUrl,
        path: storagePath,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// deleteUpload  (INN-133)
// ---------------------------------------------------------------------------
//
// Deletes a file from the request-photos bucket. Verifies that the path
// belongs to the authenticated user (user_id segment matches auth.uid()).

export async function deleteUpload(path: string): Promise<ActionResult> {
  const parsed = deleteUploadSchema.safeParse({ path });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Path format: request-photos/{hotel_id}/{user_id}/{filename}
    // Verify the path contains the authenticated user's ID as the third segment.
    const segments = parsed.data.path.split("/");
    // Expected: ["request-photos", "{hotel_id}", "{user_id}", "{filename}"]
    const pathUserId = segments[2];
    if (!pathUserId || pathUserId !== user.id) {
      return { success: false, error: "Forbidden" };
    }

    // The path passed to Supabase storage must be relative to the bucket root,
    // i.e., strip the leading "request-photos/" prefix if present.
    const bucketRelativePath = parsed.data.path.startsWith(`${STORAGE_BUCKET}/`)
      ? parsed.data.path.slice(STORAGE_BUCKET.length + 1)
      : parsed.data.path;

    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([bucketRelativePath]);

    if (deleteError) {
      return { success: false, error: "Failed to delete file" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
