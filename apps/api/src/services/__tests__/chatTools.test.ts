import { describe, expect, it, vi } from 'vitest'
import type { ChatRetrievalService } from '../chatRetrievalService'
import { ChatToolExecutor } from '../chatTools'

/**
 * The argument cleaning between the model and the database.
 *
 * The model fills tool arguments freely: placeholders, invented enum members,
 * negative limits, fractional years. Every one of those used to reach Postgres
 * and come back as an error the model could not tell apart from "not found".
 * These tests pin what the retrieval layer actually receives.
 */
function stubRetrieval() {
  return {
    listFaculties: vi.fn(async () => []),
    searchCourses: vi.fn(async () => ({ courses: [], matchMode: 'exact' })),
    getCourse: vi.fn(async () => null),
    getCourseReviews: vi.fn(async () => []),
    searchDegrees: vi.fn(async () => ({ degrees: [], matchMode: 'exact' })),
    getDegree: vi.fn(async () => null)
  }
}

function executor() {
  const retrieval = stubRetrieval()
  return {
    retrieval,
    tools: new ChatToolExecutor(retrieval as unknown as ChatRetrievalService)
  }
}

describe('ChatToolExecutor argument cleaning', () => {
  it('drops an invented review topic instead of passing it to the query', async () => {
    const { retrieval, tools } = executor()
    await tools.execute('get_course_reviews', {
      courseId: 42,
      topic: 'difficulty'
    })
    expect(retrieval.getCourseReviews).toHaveBeenCalledWith({
      courseId: 42,
      topic: undefined,
      limit: undefined
    })
  })

  it('keeps a topic that is in the enum', async () => {
    const { retrieval, tools } = executor()
    await tools.execute('get_course_reviews', { courseId: 42, topic: 'tips' })
    expect(retrieval.getCourseReviews).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'tips' })
    )
  })

  it('drops an invented sort', async () => {
    const { retrieval, tools } = executor()
    await tools.execute('search_courses', { query: 'AMS', sort: 'difficulty' })
    expect(retrieval.searchCourses).toHaveBeenCalledWith(
      expect.objectContaining({ sort: undefined })
    )
  })

  it('treats a negative, fractional or absurd number as absent', async () => {
    const { retrieval, tools } = executor()
    await tools.execute('search_courses', {
      query: 'AMS',
      curriculumYear: 2.5,
      minReviews: -3,
      limit: 1e12
    })
    expect(retrieval.searchCourses).toHaveBeenCalledWith(
      expect.objectContaining({
        curriculumYear: undefined,
        minReviews: undefined,
        // Above the cap is clamped, not dropped: the model asked for "many".
        limit: 50
      })
    )
  })

  it('refuses an id that cannot be a row without touching the database', async () => {
    const { retrieval, tools } = executor()
    const negative = await tools.execute('get_course', { courseId: -1 })
    const huge = await tools.execute('get_degree', { degreeId: 1e12 })
    expect(negative.payload).toEqual({ error: 'courseId is required' })
    expect(huge.payload).toEqual({ error: 'degreeId is required' })
    expect(retrieval.getCourse).not.toHaveBeenCalled()
    expect(retrieval.getDegree).not.toHaveBeenCalled()
  })

  it('still reads zero as a placeholder, not a value', async () => {
    const { retrieval, tools } = executor()
    await tools.execute('search_courses', {
      query: 'AMS',
      curriculumYear: 0,
      minReviews: 0
    })
    expect(retrieval.searchCourses).toHaveBeenCalledWith(
      expect.objectContaining({
        curriculumYear: undefined,
        minReviews: undefined
      })
    )
  })
})
