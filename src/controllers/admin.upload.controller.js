import { Readable } from 'node:stream';
import { validateImageBuffer, MAX_FILE_SIZE, MAX_FILES_PER_REQUEST } from '../utils/image.validation.js';
import { uploadImageToImgBB } from '../services/imgbb.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * POST /api/admin/upload/image
 * Accepts a single image in multipart/form-data under field 'image' or 'file'.
 */
export async function uploadSingleImage(req, res, next) {
  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return sendError(res, 'Invalid content type. Expected multipart/form-data.', 400);
    }

    // Quick content-length check to reject oversized uploads early
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > MAX_FILE_SIZE + 1024 * 1024) {
      return sendError(res, `Upload payload exceeds the allowed limit of ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB.`, 400);
    }

    // Parse multipart form data using native Node.js web standard streams
    let formData;
    try {
      const webStream = Readable.toWeb(req);
      const response = new Response(webStream, {
        headers: { 'content-type': contentType },
      });
      formData = await response.formData();
    } catch (parseError) {
      console.error('[Upload Controller] Multipart parsing failed:', parseError.message);
      return sendError(res, 'Failed to parse multipart form data. Please ensure payload is valid.', 400);
    }

    const file = formData.get('image') || formData.get('file');
    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
      return sendError(res, 'Image file is required in field "image" or "file".', 400);
    }

    if (file.size === 0) {
      return sendError(res, 'Image file cannot be empty.', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate binary magic bytes and file limits
    const validation = validateImageBuffer(buffer, file.type, file.name);
    if (!validation.isValid) {
      return sendError(res, validation.error, 400);
    }

    // Forward image to ImgBB official API
    const uploadResult = await uploadImageToImgBB(buffer, validation.sanitizedFileName);

    return sendSuccess(
      res,
      {
        ...uploadResult,
        mimeType: validation.mimeType,
        extension: validation.extension,
      },
      201,
      'Image uploaded successfully'
    );
  } catch (error) {
    console.error('[Upload Controller Error]:', error.message);
    return sendError(res, error.message || 'Image upload failed', 502);
  }
}

/**
 * POST /api/admin/upload/images
 * Accepts multiple images in multipart/form-data under fields 'images' or 'files'.
 */
export async function uploadMultipleImages(req, res, next) {
  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return sendError(res, 'Invalid content type. Expected multipart/form-data.', 400);
    }

    // Parse multipart form data using native Node.js web standard streams
    let formData;
    try {
      const webStream = Readable.toWeb(req);
      const response = new Response(webStream, {
        headers: { 'content-type': contentType },
      });
      formData = await response.formData();
    } catch (parseError) {
      console.error('[Upload Controller] Multipart parsing failed:', parseError.message);
      return sendError(res, 'Failed to parse multipart form data.', 400);
    }

    const files = [
      ...formData.getAll('images'),
      ...formData.getAll('files'),
      ...formData.getAll('image'),
      ...formData.getAll('file'),
    ].filter((f) => f && typeof f !== 'string' && typeof f.arrayBuffer === 'function');

    if (files.length === 0) {
      return sendError(res, 'At least one image file is required in field "images" or "files".', 400);
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return sendError(res, `Cannot upload more than ${MAX_FILES_PER_REQUEST} images in a single request.`, 400);
    }

    // Validate all image buffers first
    const validatedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size === 0) {
        return sendError(res, `File at index ${i} is empty.`, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const validation = validateImageBuffer(buffer, file.type, file.name);
      if (!validation.isValid) {
        return sendError(res, `File at index ${i} (${file.name || 'unnamed'}): ${validation.error}`, 400);
      }

      validatedFiles.push({ buffer, validation });
    }

    // Upload concurrently to ImgBB
    const uploadPromises = validatedFiles.map(async ({ buffer, validation }) => {
      const result = await uploadImageToImgBB(buffer, validation.sanitizedFileName);
      return {
        ...result,
        mimeType: validation.mimeType,
        extension: validation.extension,
      };
    });

    const uploadResults = await Promise.all(uploadPromises);

    return sendSuccess(
      res,
      uploadResults,
      201,
      `Successfully uploaded ${uploadResults.length} image(s)`
    );
  } catch (error) {
    console.error('[Upload Controller Error]:', error.message);
    return sendError(res, error.message || 'Multiple image upload failed', 502);
  }
}
