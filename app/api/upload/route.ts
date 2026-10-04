import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'jpg'
    const key = `pets/${userId}/${Date.now()}.${ext}`

    await S3.send(
      new PutObjectCommand({
        Bucket: 'petid-photos',
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const publicUrl = `${R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    console.error('R2 upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
