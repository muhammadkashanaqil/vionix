// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// export const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// export async function createPresignedUploadUrl({ key, contentType }) {
//   const bucket = process.env.S3_BUCKET_NAME;

//   const command = new PutObjectCommand({
//     Bucket: bucket,
//     Key: key,
//     ContentType: contentType,
//     // ✅ IMPORTANT: do NOT set ACL here for now (avoid signature/header issues)
//   });

//   const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
//   return uploadUrl;
// }



// src/app/lib/aws-s3.js
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function sanitizeFilename(name = "upload.png") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Uploads a browser File (from formData.get("image")) to S3 using server creds.
 * Returns { key, publicUrl } where publicUrl is a presigned GET url.
 */
export async function uploadImageToS3({ file, keyPrefix = "ads" }) {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("S3_BUCKET_NAME not set");

  const contentType = file.type || "application/octet-stream";
  const safeName = sanitizeFilename(file.name || "upload.png");

  const key = `${keyPrefix}/${Date.now()}-${safeName}`;

  // Convert File/Blob -> Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  // Presigned GET URL so n8n can fetch the image (works even if bucket is private)
  const getUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 60 * 60 * 24 } // 24 hours (change if you want)
  );

  return { key, imageUrl: getUrl };
}
