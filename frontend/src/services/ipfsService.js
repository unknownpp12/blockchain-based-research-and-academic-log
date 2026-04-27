import axios from "axios";

const BASE_URL = "https://blockchain-based-research-and-academic.onrender.com";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

/**
 * Uploads an encrypted file blob to IPFS via the backend.
 * Returns the IPFS CID string.
 */
export async function uploadFileToIPFS(blob, filename = "encrypted.dat") {
  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await axios.post(`${BASE_URL}/upload-file`, formData);
  return response.data.IpfsHash;
}

/**
 * Uploads a raw (public) file to IPFS via the backend.
 * Returns the IPFS CID string.
 */
export async function uploadPublicFileToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${BASE_URL}/upload-file`, formData);
  return response.data.IpfsHash;
}

/**
 * Uploads a JSON metadata object to IPFS via the backend.
 * Returns the IPFS CID string.
 */
export async function uploadMetadataToIPFS(metadata) {
  const response = await axios.post(`${BASE_URL}/upload-json`, metadata);
  return response.data.IpfsHash;
}

/**
 * Fetches JSON metadata from IPFS via the Pinata gateway.
 * Returns the parsed metadata object.
 */
export async function fetchMetadataFromIPFS(ipfsHash) {
  const response = await axios.get(`${PINATA_GATEWAY}/${ipfsHash}`, {
    responseType: "json",
    timeout: 10000,
  });
  return response.data;
}

/**
 * Fetches encrypted file text from IPFS via the Pinata gateway.
 * Returns the raw encrypted string.
 */
export async function fetchEncryptedFileFromIPFS(fileCID) {
  const response = await axios.get(`${PINATA_GATEWAY}/${fileCID}`, {
    responseType: "text",
  });
  return response.data;
}
