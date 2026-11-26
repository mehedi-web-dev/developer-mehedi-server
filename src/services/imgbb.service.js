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
  if (!key || typeof key !== 'string' || key.trim() === '') return message;
  return message.replaceAll(key.trim(), '[REDACTED]');
}

/**
 * Uploads a validated image buffer to the official ImgBB API.
 *
 * @param {Buffer} buffer - Validated image buffer
 * @param {string} [fileName] - Sanitized filename or title
 * @returns {Promise<{ id: string, url: string, displayUrl: string, deleteUrl: string, width: number, height: number, size: number, thumb: object|null, medium: object|null }>}
 */
export async function uploadImageToImgBB(buffer, fileName = '') {
  const apiKey = (process.env.IMGBB_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Image upload service is not configured. Missing IMGBB_API_KEY in environment variables.');
  }

  const uploadTimeoutMs = parseInt(process.env.IMGBB_TIMEOUT_MS || '12000', 10);
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
      signal: AbortSignal.timeout(uploadTimeoutMs),
    });
  } catch (networkError) {
    const isTimeout =
      networkError.name === 'TimeoutError' ||
      networkError.name === 'AbortError' ||
      networkError.code === 20;

    if (isTimeout) {
      console.error(`[ImgBB Service] Upload timed out after ${uploadTimeoutMs}ms`);
      throw new Error(`Image storage provider (api.imgbb.com) timed out after ${Math.round(uploadTimeoutMs / 1000)} seconds. The remote service is slow or unreachable.`);
    }

    const safeNetError = sanitizeErrorMessage(networkError.message, apiKey);
    console.error('[ImgBB Service] Network error during upload:', safeNetError);
    throw new Error(`Failed to connect to image storage provider (api.imgbb.com): ${safeNetError}`);
  }

  let result;
  try {
    result = await response.json();
  } catch (parseError) {
    console.error('[ImgBB Service] Failed to parse ImgBB response JSON');
    throw new Error(`Image storage provider returned an unparseable response (HTTP ${response.status}).`);
  }

  if (!response.ok || !result || !result.success || !result.data) {
    const errorCode = result?.error?.code;
    const rawError = result?.error?.message || `ImgBB storage provider returned HTTP ${response.status}`;

    let userMessage;
    if (errorCode === 103) {
      userMessage = 'ImgBB API key or account is forbidden/restricted by provider (Error Code 103). Please verify your ImgBB account standing or configure a new IMGBB_API_KEY.';
    } else if (errorCode === 100) {
      userMessage = 'The configured IMGBB_API_KEY is invalid (Error Code 100). Please check your environment configuration.';
    } else {
      userMessage = `Image storage provider error (${errorCode ? `Code ${errorCode}: ` : ''}${sanitizeErrorMessage(rawError, apiKey)})`;
    }

    console.error('[ImgBB Service] Upload failed at provider:', userMessage);
    throw new Error(userMessage);
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
