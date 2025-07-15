export const authProfiles = {
  'low': 2,
  'medium': 1,
  'high': 0
} 

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
 * Remove non numeric values
 */
export function getWhatsappNumberFromId(id: string): string {
  // Remove all non-numeric characters from the input string
  return id.replace(/\D/g, '');
}

