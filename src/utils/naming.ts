import { DEFAULT_NAME_TEMPLATES } from './constants'

const TOKEN_REGEX = /\{n\}/g

const isNonEmpty = (value: string): boolean => value.trim().length > 0

export function applyNameTemplate(
  template: string,
  nextNumber: number,
  fallbackTemplate: string,
): string {
  const sourceTemplate = isNonEmpty(template) ? template.trim() : fallbackTemplate
  const safeNumber = Number.isFinite(nextNumber) ? Math.max(1, Math.floor(nextNumber)) : 1

  if (sourceTemplate.includes('{n}')) {
    return sourceTemplate.replace(TOKEN_REGEX, String(safeNumber))
  }

  return `${sourceTemplate} ${safeNumber}`
}

export function getDefaultTemplate(templateType: 'staff' | 'newcomer' | 'container'): string {
  return DEFAULT_NAME_TEMPLATES[templateType]
}
