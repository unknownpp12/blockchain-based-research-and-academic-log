/**
 * Converts an ArrayBuffer to a Base64-encoded string using 32KB chunks
 * to avoid call stack overflow on large files.
 */
export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

/**
 * Generates a formatted citation string for a research version.
 * Supports APA, MLA, and IEEE formats.
 */
export function generateCitation(v, format = "APA") {
  const year = new Date(Number(v.timestamp)).getFullYear();

  const author =
    v.coAuthor && v.coAuthor.trim() !== ""
      ? v.coAuthor
      : v.uploader || "Unknown Author";

  const title = v.title || "Untitled";
  const source = "ResearchLog DApp";
  const link =
    v.isPublic && v.publicCID
      ? `https://gateway.pinata.cloud/ipfs/${v.publicCID}`
      : "Private/Shared research (open via app)";

  if (format === "APA") {
    return `${author} (${year}). ${title}. ${source}. ${link}`;
  }

  if (format === "MLA") {
    return `${author}. "${title}." ${source}, ${year}, ${link}.`;
  }

  if (format === "IEEE") {
    return `${author}, "${title}," ${source}, ${year}. [Online]. Available: ${link}`;
  }

  return "Invalid format";
}
