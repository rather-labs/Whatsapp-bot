// Parse vCard content and extract specific fields
export function parseVCard(vCardContent) {
    const lines = vCardContent.split('\n');
    const vCardData = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and vCard boundaries
      if (!trimmedLine || trimmedLine === 'begin:vcard' || trimmedLine === 'end:vcard' || trimmedLine.startsWith('version:')) {
        continue;
      }

      // Parse FN (Formatted Name)
      if (trimmedLine.toLowerCase().startsWith('fn:')) {
        vCardData.fn = trimmedLine.substring(3);
      }
      
      // Parse N (Name)
      if (trimmedLine.toLowerCase().startsWith('n:')) {
        vCardData.n = trimmedLine.substring(2);
      }
      
      // Parse TEL with type and waid
      if (trimmedLine.toLowerCase().startsWith('tel;')) {
        // Extract type
        const typeMatch = trimmedLine.match(/type=([^;]+)/);
        if (typeMatch) {
          vCardData.type = typeMatch[1];
        }
        
        // Extract waid
        const waidMatch = trimmedLine.match(/waid=([^:]+)/);
        if (waidMatch) {
          vCardData.waid = waidMatch[1];
        }
        
        // Extract phone number (after the last colon)
        const phoneMatch = trimmedLine.match(/:([^:]+)$/);
        if (phoneMatch) {
          vCardData.phone = phoneMatch[1];
        }
      }
    }

    return vCardData;
}