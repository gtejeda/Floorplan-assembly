import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new UUID v4 string
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a prefixed ID for better debugging
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${uuidv4()}`;
}

/**
 * Validate if a string is a valid UUID v4
 */
export function isValidUuid(id: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
}
