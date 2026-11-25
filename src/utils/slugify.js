/**
 * Generates a URL-friendly slug from an input string.
 *
 * @param {string} text - The input text to slugify
 * @returns {string} - Clean, hyphenated, lowercase slug
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}
