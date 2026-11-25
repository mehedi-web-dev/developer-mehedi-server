/**
 * Server-side ImgBB API client integration.
 * Handles uploading binary images, response mapping, and error sanitization.
 */

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {}
}

/**
 * Strips the API key from any error message or string to prevent secret leakage.
 *
 * @param {string} message
 * @param {string} [key]
 * @returns {string}
 */
export function sanitizeErrorMessage(message, key) {
  if (!message || typeof message !== 'string') return 'An error occurred during image upload';
  if (!key) return message;
  return message.replaceAll(key, '[REDACTED]');
}

/**
 * Uploads a validated image buffer to the official ImgBB API.
 *
 * @param {Buffer} buffer - Validated image buffer
 * @param {string} [fileName] - Sanitized filename or title
 * @returns {Promise<{ id: string, url: string, displayUrl: string, deleteUrl: string, width: number, height: number, size: number, thumb: object|null, medium: object|null }>}
 */
export async function uploadImageToImgBB(buffer, fileName = '') {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('Image upload service is not configured. Missing IMGBB_API_KEY in environment variables.');
  }

  const uploadUrl = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`;

  const formData = new FormData();
  formData.append('image', buffer.toString('base64'));

  if (fileName) {
    const title = fileName.replace(/\.[^/.]+$/, '');
    formData.append('name', title);
  }

  let response;
  try {
    response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(25000), // 25-second timeout
    });
  } catch (networkError) {
    console.error('[ImgBB Service] Network error during upload:', networkError.message);
    throw new Error('Failed to connect to image storage provider. Operation timed out or network error.');
  }

  let result;
  try {
    result = await response.json();
  } catch (parseError) {
    console.error('[ImgBB Service] Failed to parse ImgBB response JSON');
    throw new Error('Invalid response received from image storage provider.');
  }

  if (!response.ok || !result || !result.success || !result.data) {
    const rawError = result?.error?.message || `ImgBB storage provider returned HTTP ${response.status}`;
    const safeError = sanitizeErrorMessage(rawError, apiKey);
    console.error('[ImgBB Service] Upload failed at provider:', safeError);
    throw new Error(safeError);
  }

  const { data } = result;

  return {
    id: data.id,
    url: data.url,
    displayUrl: data.display_url,
    deleteUrl: data.delete_url, // For authenticated admin audit; never exposed through public APIs
    width: Number(data.width) || null,
    height: Number(data.height) || null,
    size: Number(data.size) || buffer.length,
    thumb: data.thumb ? { url: data.thumb.url } : null,
    medium: data.medium ? { url: data.medium.url } : null,
  };
}
