import { requireAdmin } from '@middleware'
import { AIService, R2Service } from '@services'
import { database } from '@uni-feedback/db'
import { audioRecordings } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'

export class ProcessAudio extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Audio Feedback'],
    summary: 'Process audio recording via AI',
    description:
      'Uploads audio to R2, runs multimodal AI to extract transcript and feedback fields, inserts an audio_recordings record, and returns the extracted data.',
    responses: {
      '200': {
        description: 'Audio processed successfully',
        content: {
          'application/json': {
            schema: z.object({
              audioId: z.number(),
              transcript: z.string(),
              comment: z.string().nullable(),
              rating: z.number().nullable(),
              workloadRating: z.number().nullable()
            })
          }
        }
      },
      '400': {
        description: 'Missing audio file or courseId',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    await requireAdmin(c)
    const env = c.env as Env

    const formData = await c.req.formData()
    const audioFile = formData.get('audio') as File | null
    const courseIdRaw = formData.get('courseId')

    if (!audioFile) {
      return Response.json({ error: 'audio file is required' }, { status: 400 })
    }

    const courseId = parseInt(String(courseIdRaw), 10)
    if (isNaN(courseId) || courseId <= 0) {
      return Response.json(
        { error: 'courseId must be a positive integer' },
        { status: 400 }
      )
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    const mimeType = audioFile.type || 'audio/webm'

    const r2Service = new R2Service(env)
    const r2Key = r2Service.generateAudioKey(courseId)
    await r2Service.uploadAudio(r2Key, audioBuffer, mimeType)

    // Derive format from MIME type (e.g. 'audio/webm;codecs=opus' → 'webm')
    const audioFormat = mimeType.split('/')[1]?.split(';')[0] ?? 'webm'

    try {
      const aiService = new AIService(env)
      const extraction = await aiService.processAudioFeedback(
        audioBuffer,
        mimeType
      )

      const [inserted] = await database()
        .insert(audioRecordings)
        .values({
          courseId,
          r2Key,
          audioFormat,
          transcript: extraction.transcript,
          consentGiven: false
        })
        .returning({ id: audioRecordings.id })

      return Response.json({
        audioId: inserted.id,
        transcript: extraction.transcript,
        comment: extraction.comment,
        rating: extraction.rating,
        workloadRating: extraction.workloadRating
      })
    } catch (e) {
      // Clean up the R2 object so orphaned files don't accumulate
      await r2Service.deleteAudio(r2Key).catch(() => {})
      throw e
    }
  }
}
