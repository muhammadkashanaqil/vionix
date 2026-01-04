import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function createPresignedUploadUrl({ key, contentType }) {
  const bucket = process.env.S3_BUCKET_NAME;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    // ✅ IMPORTANT: do NOT set ACL here for now (avoid signature/header issues)
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
  return uploadUrl;
}
