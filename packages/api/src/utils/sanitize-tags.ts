export const sanitizeTag = (tag: string): string =>
  tag.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export const sanitizeTags = (tags: string[] = []): string[] =>
  [...new Set(tags.map(sanitizeTag).filter(Boolean))]
