/**
 * Generates a unique file ID for upload tracking.
 * Uses a counter-based approach for deterministic testing.
 */

let counter = 0;

function randomPart(): string {
  // Use Math.random when available (browser/runtime), fallback to counter
  try {
    return Math.random().toString(36).slice(2, 8);
  } catch {
    counter += 1;
    return counter.toString(36).padStart(6, '0');
  }
}

export function createUploadFileId(): string {
  let timestamp: string;
  try {
    timestamp = Date.now().toString(36);
  } catch {
    counter += 1;
    timestamp = counter.toString(36);
  }
  return `${timestamp}-${randomPart()}`;
}
