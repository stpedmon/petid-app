/**
 * Calculate pet age from date of birth.
 * Returns a human-readable string, never negative values.
 *
 * Examples:
 *  - 24 días
 *  - 3 semanas
 *  - 1 mes
 *  - 5 meses
 *  - 1 año
 *  - 2 años 3m
 */
export function getPetAge(dob: string | null | undefined): string {
  if (!dob) return ''

  const birthDate = new Date(dob)
  const now = new Date()

  // If birth date is in the future, show "Recién nacido"
  if (birthDate > now) return 'Recién nacido'

  const diffMs = now.getTime() - birthDate.getTime()
  const totalDays = Math.floor(diffMs / 86400000)

  if (totalDays < 1) return 'Recién nacido'
  if (totalDays < 7) return `${totalDays} día${totalDays !== 1 ? 's' : ''}`
  if (totalDays < 30) {
    const weeks = Math.floor(totalDays / 7)
    return `${weeks} semana${weeks !== 1 ? 's' : ''}`
  }

  // Calculate months and years using calendar math for accuracy
  let years = now.getFullYear() - birthDate.getFullYear()
  let months = now.getMonth() - birthDate.getMonth()
  if (now.getDate() < birthDate.getDate()) months--
  if (months < 0) {
    years--
    months += 12
  }

  if (years > 0) {
    const yearStr = `${years} año${years > 1 ? 's' : ''}`
    return months > 0 ? `${yearStr} ${months}m` : yearStr
  }

  return `${months} mes${months !== 1 ? 'es' : ''}`
}
