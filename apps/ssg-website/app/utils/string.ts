export function removeAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function insensitiveMatch(s: string, q: string) {
  const sNormalized = removeAccents(s.toLocaleLowerCase())
  const qNormalized = removeAccents(q.toLocaleLowerCase())
  return sNormalized.includes(qNormalized)
}
