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
  const rawTimestamp = Number(v.timestamp);
  const timestampMs =
    rawTimestamp < 1000000000000 ? rawTimestamp * 1000 : rawTimestamp;

  const year = new Date(timestampMs).getFullYear();

  const author =
    v.author && v.author.trim() !== ""
      ? v.author
      : v.coAuthor && v.coAuthor.trim() !== ""
      ? v.coAuthor
      : v.uploader || "Unknown Author";

  const title = v.title || "Untitled";
  const sourceParts = [
  v.institution,
  v.category,
  "ResearchLog DApp"
  ].filter(Boolean);
  const source = sourceParts.join(". ");

    const tags =
    Array.isArray(v.tags) && v.tags.length > 0
      ? ` Keywords: ${v.tags.join(", ")}.`
      : "";

  const link =
    v.isPublic && v.publicCID
      ? `https://gateway.pinata.cloud/ipfs/${v.publicCID}`
      :  `Private/shared research. File hash: ${v.fileHash}`;

  if (format === "APA") {
    return `${author} (${year}). ${title}. ${source}.${tags} ${link}`;
  }

  if (format === "MLA") {
    return `${author}. "${title}." ${source}, ${year}.${tags} ${link}.`;
  }

  if (format === "IEEE") {
    return `${author}, "${title}," ${source}, ${year}.${tags} [Online]. Available: ${link}`;
  }

  return "Invalid format";
}
