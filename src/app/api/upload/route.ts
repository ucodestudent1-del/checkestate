import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/session";
import crypto from "crypto";
import { handleApiError } from "@/lib/errors";

const BUCKET = process.env.S3_BUCKET || "checkestate-uploads";
const REGION = process.env.S3_REGION || "us-east-1";
const ENDPOINT = process.env.S3_ENDPOINT || undefined;

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
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getBaseUrl() {
  return ENDPOINT || `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const body = await req.json();
    const { fileName, fileType, folder } = body as GeneratePresignedUrlRequest;

    if (!fileName || !fileType || !folder) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const key = `${folder}/${crypto.randomBytes(16).toString("hex")}-${fileName}`;

    return NextResponse.json({
      uploadUrl: `${getBaseUrl()}/${key}`,
      fileUrl: `${getBaseUrl()}/${key}`,
      key,
      expiresIn: 300,
      requiresSignature: !!process.env.S3_ACCESS_KEY_ID,
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

    return NextResponse.json({ message: "File deletion queued" });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
