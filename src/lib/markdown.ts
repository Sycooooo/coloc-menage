// Mini-renderer Markdown pour les post-its du tableau
// Supporte : **gras**, *italique*, - listes, sauts de ligne

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderMiniMarkdown(text: string): string {
  const escaped = escapeHtml(text)
  const lines = escaped.split('\n')
  const result: string[] = []
  let inList = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('- ')) {
      if (!inList) {
        result.push('<ul class="list-disc list-inside space-y-0.5">')
        inList = true
      }
      result.push(`<li>${formatInline(trimmed.slice(2))}</li>`)
    } else {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      if (trimmed === '') {
        result.push('<br/>')
      } else {
        result.push(formatInline(trimmed))
      }
    }
  }

  if (inList) result.push('</ul>')
  return result.join('\n')
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}
