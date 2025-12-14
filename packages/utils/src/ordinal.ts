/**
 * Converts a number to its ordinal representation (1st, 2nd, 3rd, etc.)
 * @param num - The number to convert
 * @returns The ordinal representation of the number
 */
export function toOrdinal(num: number): string {
  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  // Special cases for 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`
  }

  switch (lastDigit) {
    case 1:
      return `${num}st`
    case 2:
      return `${num}nd`
    case 3:
      return `${num}rd`
    default:
      return `${num}th`
  }
}
