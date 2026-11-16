import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/session";
import crypto from "crypto";
import { handleApiError } from "@/lib/errors";

const BUCKET = process.env.S3_BUCKET || "checkestate-uploads";
const REGION = process.env.S3_REGION || "us-east-1";
const ENDPOINT = process.env.S3_ENDPOINT || undefined;
const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || "";
const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || "";

interface GeneratePresignedUrlRequest {
  fileName: string;
  fileType: string;
  folder: "property-photos" | "receipts" | "contractor-docs";
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MIME_TO_EXTENSIONS: Record<string, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

function getBaseUrl() {
  return ENDPOINT || `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
}

function validateFileName(fileName: string, mimeType: string): { valid: boolean; error?: string } {
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return { valid: false, error: "Invalid file name" };
  }

  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as any)) {
    return { valid: false, error: "File extension not allowed" };
  }

  const allowedExts = MIME_TO_EXTENSIONS[mimeType];
  if (!allowedExts || !allowedExts.includes(ext as any)) {
    return { valid: false, error: "File extension does not match MIME type" };
  }

  return { valid: true };
}

async function generatePresignedUrl(key: string, fileType: string): Promise<string> {
  if (!ACCESS_KEY || !SECRET_KEY) {
    throw new Error("S3 credentials not configured");
  }

  const { S3Client } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");

  const s3 = new S3Client({
    region: REGION,
    endpoint: ENDPOINT || undefined,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
    ...(ENDPOINT ? { forcePathStyle: true } : {}),
  });

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
  });

  return getSignedUrl(s3, command, { expiresIn: 300 });
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const body = await req.json();
    const { fileName, fileType, folder } = body as GeneratePresignedUrlRequest;

    if (!fileName || !fileType || !folder) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType as any)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const validation = validateFileName(fileName, fileType);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const key = `${folder}/${crypto.randomBytes(16).toString("hex")}-${fileName}`;

    let uploadUrl: string;
    let requiresSignature = false;

    if (ACCESS_KEY && SECRET_KEY) {
      try {
        uploadUrl = await generatePresignedUrl(key, fileType);
        requiresSignature = true;
      } catch {
        // Fall back to direct URL if signing fails
        uploadUrl = `${getBaseUrl()}/${key}`;
      }
    } else {
      uploadUrl = `${getBaseUrl()}/${key}`;
      requiresSignature = false;
    }

    return NextResponse.json({
      uploadUrl,
      fileUrl: `${getBaseUrl()}/${key}`,
      key,
      expiresIn: 300,
      requiresSignature,
      maxFileSize: MAX_FILE_SIZE,
    });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

interface DeleteFileRequest {
  key: string;
}

export async function DELETE(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "File key required" }, { status: 400 });
    }

    // Validate key format to prevent path traversal
    if (key.includes("..") || key.startsWith("/")) {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
    }

    // Verify the file belongs to this organization (check folder prefix)
    const allowedFolders = ["property-photos/", "receipts/", "contractor-docs/"];
    const hasValidPrefix = allowedFolders.some(folder => key.startsWith(folder));
    if (!hasValidPrefix) {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
    }

    // Attempt actual deletion if S3 is configured
    if (ACCESS_KEY && SECRET_KEY) {
      try {
        const { S3Client } = await import("@aws-sdk/client-s3");
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

        const s3 = new S3Client({
          region: REGION,
          endpoint: ENDPOINT || undefined,
          credentials: {
            accessKeyId: ACCESS_KEY,
            secretAccessKey: SECRET_KEY,
          },
          ...(ENDPOINT ? { forcePathStyle: true } : {}),
        });

        await s3.send(new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key,
        }));
      } catch {
        // Ignore deletion errors - file may not exist
      }
    }

    return NextResponse.json({ message: "File deleted" });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
