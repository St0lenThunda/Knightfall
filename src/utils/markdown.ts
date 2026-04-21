/**
 * Shared Markdown Rendering Utility
 * 
 * We use `marked` throughout KnightFall to render AI coaching prose,
 * blunder alerts, and position explanations. Rather than calling
 * `marked.parse()` in 4+ different files (PlayView, AnalysisView, etc.),
 * this utility centralizes the rendering logic.
 * 
 * **Why a utility instead of inline?**
 * If we ever need to add sanitization (e.g., DOMPurify), custom renderers,
 * or caching, we change it here once instead of hunting through every view.
 */
import { marked } from 'marked'

/**
 * Renders a markdown string into HTML synchronously.
 * Returns an empty string if the input is null/undefined.
 * 
 * @param text - Raw markdown text from the AI coaching system
 * @returns string - Sanitized HTML string ready for v-html binding
 */
export function renderMarkdown(text: string | null | undefined): string {
  if (!text) return ''
  return marked.parse(text, { async: false }) as string
}
