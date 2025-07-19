/**
 * Represents the configuration options for determining the school year.
 */
export interface SchoolYearConfig {
  /** The month (1-12) when the school year starts. Defaults to September (9). */
  startMonth?: number
}

/**
 * Represents the configuration options for formatting an school year string.
 */
export interface SchoolYearFormatConfig {
  /** The separator to use between years. Defaults to '/'. */
  separator?: string
  /** The format for the year display. Defaults to 'short' (2 digits). */
  yearFormat?: 'short' | 'long'
}

/**
 * Determines the school year for a given date.
 *
 * @param date - The date to determine the school year for
 * @param startMonth - The month (1-12) when the school year starts
 * @returns The school year number
 *
 * @example
 * // For a date in September 2023 with school year starting in September
 * getSchoolYear(new Date('2023-09-15'), 9) // returns 2023
 *
 * // For a date in August 2023 with school year starting in September
 * getSchoolYear(new Date('2023-08-15'), 9) // returns 2022
 */
export function getSchoolYear(date: Date, startMonth: number): number {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth() returns 0-11
  return month >= startMonth ? year : year - 1
}

/**
 * Gets the current school year based on the current date.
 *
 * @param config - Configuration options for determining the school year
 * @returns The current school year number
 *
 * @example
 * // Get current school year starting in September
 * getCurrentSchoolYear({ startMonth: 9 })
 */
export function getCurrentSchoolYear({
  startMonth = 9
}: SchoolYearConfig = {}): number {
  return getSchoolYear(new Date(), startMonth)
}

/**
 * Formats an school year as a string representation.
 *
 * @param schoolYear - The school year to format
 * @param config - Configuration options for formatting the school year string
 * @returns A formatted string representation of the school year
 *
 * @example
 * // Format as "23/24"
 * formatSchoolYearString(2023, { separator: '/', yearFormat: 'short' })
 *
 * // Format as "2023-2024"
 * formatSchoolYearString(2023, { separator: '-', yearFormat: 'long' })
 */
export function formatSchoolYearString(
  schoolYear: number,
  { separator = '/', yearFormat = 'short' }: SchoolYearFormatConfig = {}
): string {
  const startYear = schoolYear
  const endYear = schoolYear + 1
  return `${formatYear(startYear, yearFormat)}${separator}${formatYear(endYear, yearFormat)}`
}

/**
 * Formats a year according to the specified format.
 *
 * @param year - The year to format
 * @param format - The format to use ('short' for 2 digits, 'long' for 4 digits)
 * @returns The formatted year string
 *
 * @example
 * formatYear(2023, 'short') // returns "23"
 * formatYear(2023, 'long') // returns "2023"
 */
export function formatYear(year: number, format: 'short' | 'long'): string {
  let yearString = year.toString()
  if (format === 'short') {
    yearString = yearString.slice(2)
  }
  return yearString
}
