import mongoose from 'mongoose';

/**
 * Validates whether a given string is a valid 24-character hexadecimal MongoDB ObjectId.
 *
 * @param {string} id - The string to validate
 * @returns {boolean}
 */
export function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}
