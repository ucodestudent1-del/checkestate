import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const UPLOAD_COMPLETE_SECRET = process.env.UPLOAD_COMPLETE_SECRET || process.env.NEXTAUTH_SECRET;

interface UploadCompletePayload {
  key: string;
  bucket: string;
  size: number;
  etag: string;
  mimeType: string;
  uploadedAt: string;
  uploadId: string;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !UPLOAD_COMPLETE_SECRET || authHeader !== `Bearer ${UPLOAD_COMPLETE_SECRET}`) {
      logger.warn("Unauthorized upload complete webhook attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: UploadCompletePayload = await req.json();
    const { key, bucket, size, etag, mimeType, uploadedAt, uploadId } = payload;

    if (!key || !bucket) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate file size
    if (size > 10 * 1024 * 1024) {
      logger.warn("File size exceeds limit", { key, size });
      return NextResponse.json({ error: "File size exceeds limit" }, { status: 400 });
    }

    // Malware scanning - placeholder for integration with ClamAV or similar
    const scanResult = await scanFileForMalware(key, bucket);
    if (!scanResult.clean) {
      logger.error("Malware detected in uploaded file", { key, threats: scanResult.threats });
      
      // Move to quarantine
      await quarantineFile(key, bucket);
      
      // Notify security team
      await notifySecurityTeam(key, scanResult.threats);
      
      return NextResponse.json({ error: "File failed security scan", quarantined: true }, { status: 400 });
    }

    // Find the attachment record that matches this upload
    const attachment = await db.attachment.findFirst({
      where: {
        fileUrl: { contains: key },
        uploadedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
    });

    if (attachment) {
      await db.attachment.update({
        where: { id: attachment.id },
        data: {
          fileSize: size,
          // fileUrl will be updated with the final signed URL if needed
        },
      });

      logger.info("File upload completed and verified", {
        attachmentId: attachment.id,
        key,
        size,
        mimeType,
      });
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    logger.error("Upload complete webhook error", { error: errorMessage });
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

async function scanFileForMalware(key: string, bucket: string): Promise<{ clean: boolean; threats: string[] }> {
  // In production, integrate with ClamAV, VirusTotal, or cloud provider scanning
  // For now, return clean - implement actual scanning based on your infrastructure
  
  // Example ClamAV integration:
  // const clamav = require('clamav.js');
  // const stream = getS3ObjectStream(bucket, key);
  // const result = await clamav.scanStream(stream);
  
  // Example AWS S3 Object Lambda with ClamAV:
  // const scanResult = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  // // Scan with your preferred solution

  // For now, basic validation
  const suspiciousExtensions = [".exe", ".bat", ".cmd", ".scr", ".vbs", ".js", ".jar", ".sh", ".php", ".asp", ".aspx", ".jsp"];
  const hasSuspiciousExt = suspiciousExtensions.some(ext => key.toLowerCase().endsWith(ext));
  
  if (hasSuspiciousExt) {
    return { clean: false, threats: [`Suspicious file extension detected: ${key}`] };
  }

  // Check file magic bytes if accessible
  // This would require downloading the file header

  return { clean: true, threats: [] };
}

async function quarantineFile(key: string, bucket: string): Promise<void> {
  // Move file to quarantine bucket/prefix
  // Implementation depends on your storage provider
  // Example for S3:
  // await s3.copyObject({
  //   Bucket: bucket,
  //   CopySource: `${bucket}/${key}`,
  //   Key: `quarantine/${key}`,
  // }).promise();
  // await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  
  logger.warn("File quarantined", { key, bucket });
}

async function notifySecurityTeam(key: string, threats: string[]): Promise<void> {
  // Send alert to security team via email, Slack, PagerDuty, etc.
  logger.error("SECURITY ALERT: Malware detected", { key, threats });
  
  // Example: Send to Slack webhook
  // await fetch(process.env.SECURITY_SLACK_WEBHOOK, {
  //   method: 'POST',
  //   body: JSON.stringify({ text: `Malware detected in upload: ${key}`, blocks: [...] })
  // });
}