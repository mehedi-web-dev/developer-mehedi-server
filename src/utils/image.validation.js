/**
 * Image upload validation utilities.
 * Enforces file size limits and inspects binary magic bytes for JPEG, PNG, and WEBP.
 */

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (_) {}
}

const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 10;
export const MAX_FILE_SIZE = MAX_SIZE_MB * 1024 * 1024; // Default 10 MB
export const MAX_FILES_PER_REQUEST = 10;

/**
 * Inspects binary magic bytes to detect the genuine image format.
 * Supports:
 * - JPEG (FF D8 FF)
 * - PNG (89 50 4E 47 0D 0A 1A 0A)
 * - WEBP (RIFF .... WEBP)
 *
 * @param {Buffer} buffer
 * @returns {{ mimeType: string, extension: string } | null}
 */
export function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // Check JPEG (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // Check PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  // Check WEBP (RIFF .... WEBP)
  if (
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50 // 'P'
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  return null;
}

/**
 * Validates an image buffer, its detected binary signature, and size constraints.
 *
 * @param {Buffer} buffer
 * @param {string} [claimedMimeType]
 * @param {string} [fileName]
 * @returns {{ isValid: boolean, error?: string, mimeType?: string, extension?: string, sanitizedFileName?: string }}
 */
export function validateImageBuffer(buffer, claimedMimeType = '', fileName = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return {
      isValid: false,
      error: 'Image file is empty or missing.',
    };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds the allowed limit of ${MAX_SIZE_MB} MB (received ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  const detected = detectImageFormat(buffer);
  if (!detected) {
    return {
      isValid: false,
      error: 'Invalid image signature. Only valid JPG, JPEG, PNG, and WEBP files are permitted.',
    };
  }

  // Sanitize filename to avoid path traversal or unsafe characters
  const rawBaseName = (fileName || 'upload')
    .replace(/[^\w.-]/g, '_')
    .replace(/\.+/g, '.')
    .slice(0, 80);

  const cleanBaseName = rawBaseName.replace(/\.[^/.]+$/, '') || 'upload';
  const sanitizedFileName = `${cleanBaseName}.${detected.extension}`;

  return {
    isValid: true,
    mimeType: detected.mimeType,
    extension: detected.extension,
    sanitizedFileName,
  };
}
