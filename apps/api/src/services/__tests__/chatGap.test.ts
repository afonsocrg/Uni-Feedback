import { describe, expect, it } from 'vitest'
import { ChatGapDetector } from '../chatGap'

/**
 * The rule every case here is really testing: a gap is only real if the turn
 * actually looked. Reporting something as missing when nothing went looking for
 * it is the same mistake as the confident false negative, which is the failure
 * this whole design exists to avoid.
 */
describe('ChatGapDetector', () => {
  it('reports nothing when no tool ran', () => {
    expect(new ChatGapDetector().result()).toBeNull()
  })

  it('reports no_reviews when every review lookup came back empty', () => {
    const gaps = new ChatGapDetector()
    gaps.observe('get_course', {
      courseId: 7,
      name: 'Análise e Modelação de Sistemas',
      description: 'Um curso sobre modelação.',
      pageUrl: 'https://uni-feedback.com/cadeiras/7',
      degreeId: 3,
      facultyId: 1
    })
    gaps.observe('get_course_reviews', {
      courseId: 7,
      returned: 0,
      reviews: []
    })

    expect(gaps.result()).toEqual({
      kind: 'no_reviews',
      courseId: 7,
      courseName: 'Análise e Modelação de Sistemas',
      courseUrl: 'https://uni-feedback.com/cadeiras/7',
      degreeId: 3,
      facultyId: 1
    })
  })

  it('stays quiet when one course had reviews and another did not', () => {
    // A comparison where half the evidence exists is still a usable answer, and
    // an ask under it would be asking about the half that worked.
    const gaps = new ChatGapDetector()
    gaps.observe('get_course_reviews', {
      courseId: 7,
      returned: 4,
      reviews: []
    })
    gaps.observe('get_course_reviews', {
      courseId: 9,
      returned: 0,
      reviews: []
    })

    expect(gaps.result()).toBeNull()
  })

  it('reports missing_field when the resolved course has no description', () => {
    const gaps = new ChatGapDetector()
    gaps.observe('get_course', {
      courseId: 12,
      name: 'Direito Romano',
      description: null,
      pageUrl: 'https://uni-feedback.com/cadeiras/12'
    })

    expect(gaps.result()).toMatchObject({
      kind: 'missing_field',
      field: 'description',
      courseId: 12
    })
  })

  it('prefers the review gap over the description gap', () => {
    // Both are true, but only one ask can go under an answer, and the reviews
    // are what the student asked for.
    const gaps = new ChatGapDetector()
    gaps.observe('get_course', { courseId: 5, name: 'X', description: null })
    gaps.observe('get_course_reviews', {
      courseId: 5,
      returned: 0,
      reviews: []
    })

    expect(gaps.result()?.kind).toBe('no_reviews')
  })

  it('treats whitespace as a missing description', () => {
    const gaps = new ChatGapDetector()
    gaps.observe('get_course', { courseId: 5, name: 'X', description: '   ' })

    expect(gaps.result()?.kind).toBe('missing_field')
  })

  it('reports no_courses only when a search ran and resolved nothing', () => {
    const empty = new ChatGapDetector()
    empty.observe('search_courses', { courses: [] })
    expect(empty.result()).toEqual({ kind: 'no_courses' })

    const found = new ChatGapDetector()
    found.observe('search_courses', { courses: [{ courseId: 1 }] })
    expect(found.result()).toBeNull()
  })

  it('ignores tool errors rather than reading them as emptiness', () => {
    // A failed call tells us nothing about our data, and turning an outage into
    // "we do not have this" is exactly the lie we are trying not to tell.
    const gaps = new ChatGapDetector()
    gaps.observe('search_courses', { error: 'boom' })
    gaps.observe('get_course', { error: 'No course found with id 3' })

    expect(gaps.result()).toBeNull()
  })
})
