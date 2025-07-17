export const authProfiles = ['high', 'medium', 'low'];

export const riskProfiles = ['low', 'moderate', 'high'];
/**
 * Checks if a string is a valid Ethereum (EVM) address.
 * Accepts addresses with or without '0x' prefix, must be 40 hex chars.
 */
export function isValidAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  // Remove 0x prefix if present
  const addr = address.startsWith('0x') ? address.slice(2) : address;
  // Check length and hex characters
  return addr.length === 40 && /^[0-9a-fA-F]{40}$/.test(addr);
}

/**
/**
 * Checks if a string is a valid decimal number.
 * Accepts only non-negative decimal numbers (no hex, no scientific notation).
 * Returns true if the string represents a valid decimal number, false otherwise.
 */
export function isValidNumber(value: string): boolean {
  if (typeof value !== 'string') return false;
  // Allow only digits, optionally with a single decimal point, and no leading/trailing spaces
  return /^\d+$/.test(value.trim());
}

/**
 * Remove non numeric values
 */
export function getWhatsappNumberFromId(id: string): string {
  // Remove all non-numeric characters from the input string
  return id.replace(/\D/g, '');
}

