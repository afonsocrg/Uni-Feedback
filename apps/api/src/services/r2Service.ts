import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class R2Service {
  private client: S3Client
  private bucketName: string

  constructor(env: Env) {
    if (
      !env.R2_ACCOUNT_ID ||
      !env.R2_ACCESS_KEY_ID ||
      !env.R2_SECRET_ACCESS_KEY ||
      !env.R2_BUCKET_NAME
    ) {
      throw new Error(
        'R2 credentials not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.'
      )
    }

    this.bucketName = env.R2_BUCKET_NAME

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY
      }
    })
  }

  /**
   * Generate R2 key for a course report.
   * Format: reports/{year}/course-{id}-{year}.pdf
   */
  generateKey(courseId: number, schoolYear: number): string {
    return `reports/courses/${schoolYear}/course-${courseId}-${schoolYear}.pdf`
  }

  /**
   * Upload a PDF to R2 storage.
   *
   * @param key - R2 object key
   * @param buffer - PDF buffer
   */
  async uploadPDF(key: string, buffer: Buffer): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
      Metadata: {
        uploadedAt: new Date().toISOString()
      }
    })

    await this.client.send(command)
  }

  /**
   * Generate a presigned URL for downloading a PDF.
   * URL expires in 60 minutes.
   *
   * @param key - R2 object key
   * @returns Presigned URL
   */
  async getPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })

    // Presigned URL expires in 60 minutes (3600 seconds)
    return await getSignedUrl(this.client, command, { expiresIn: 3600 })
  }

  /**
   * Delete a PDF from R2 storage.
   *
   * @param key - R2 object key
   */
  async deletePDF(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })

    await this.client.send(command)
  }
}
