import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2AccountId = process.env.R2_ACCOUNT_ID
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const r2BucketName = process.env.R2_BUCKET_NAME
const r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://pub-media.inzuconnect.com'

let s3Client: S3Client | null = null

if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
  s3Client = new S3Client({
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey
    },
    region: 'auto'
  })
}

/**
 * Génère une URL pré-signée pour le dépôt de fichiers sur Cloudflare R2.
 * Si les configurations R2 manquent, renvoie une URL locale simulée (Mock).
 */
export async function generatePresignedPutUrl(
  fileKey: string,
  contentType: string
): Promise<{ uploadUrl: string, publicUrl: string, isMock: boolean }> {
  
  if (!s3Client || !r2BucketName) {
    // Mode simulation locale
    const mockUploadUrl = `http://localhost:3001/api/listings/media/mock-upload?key=${encodeURIComponent(fileKey)}`
    const mockPublicUrl = `http://localhost:3001/uploads/${fileKey}`
    return {
      uploadUrl: mockUploadUrl,
      publicUrl: mockPublicUrl,
      isMock: true
    }
  }

  try {
    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: fileKey,
      ContentType: contentType
    })

    // URL signée valide pendant 1 heure (3600 secondes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const publicUrl = `${r2PublicUrl}/${fileKey}`

    return {
      uploadUrl,
      publicUrl,
      isMock: false
    }
  } catch (error) {
    console.error("❌ Erreur lors de la génération de l'URL pré-signée S3/R2:", error)
    throw error
  }
}
