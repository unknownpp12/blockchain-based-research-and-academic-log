import { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import {
  uploadFileToIPFS,
  uploadPublicFileToIPFS,
  uploadMetadataToIPFS,
  fetchMetadataFromIPFS,
  fetchEncryptedFileFromIPFS,
} from "../services/ipfsService";
import {
  makeFileKey,
  encryptFileKeyForUser,
  decryptFileKey,
  publicKeyToBase64,
  publicKeyFromBase64,
} from "../utils/cryptoAccess";
import { arrayBufferToBase64 } from "../utils/helpers";

const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".docx",
  ".xml",
  ".odt",
  ".rtf",
  ".md",
  ".xlsx",
  ".csv",
  ".pptx",
  ".html",
  ".htm",
  ".doc",
  ".wps",
  ".hwp",
  ".epub"
];

const MIME_TYPES_BY_EXTENSION = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".xml": "application/xml",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".rtf": "application/rtf",
  ".md": "text/markdown",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".html": "text/html",
  ".htm": "text/html",
  ".epub": "application/epub+zip",
};

function isAllowedDocument(file) {
  const fileName = file?.name?.toLowerCase() || "";
  return ALLOWED_DOCUMENT_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension)
  );
}

function getFileExtension(fileName = "") {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function getFileType(fileType, fileName) {
  const extension = getFileExtension(fileName);
  return fileType || MIME_TYPES_BY_EXTENSION[extension] || "application/octet-stream";
}

function getDownloadFileName(fileName, fileType, fallback = "research-file") {
  if (fileName && getFileExtension(fileName)) return fileName;

  const matchingExtension = Object.entries(MIME_TYPES_BY_EXTENSION).find(
    ([, mimeType]) => mimeType === fileType
  )?.[0];

  return `${fileName || fallback}${matchingExtension || ""}`;
}

function openBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isCryptoJSEncryptedText(value) {
  return typeof value === "string" && value.trim().startsWith("U2FsdGVkX1");
}

async function ensureContractHasCode(contract) {
  const provider = contract?.runner?.provider;
  const address = contract?.target || contract?.address;

  if (!provider || !address) return;

  const code = await provider.getCode(address);

  if (code === "0x") {
    throw new Error(
      "No ResearchLog contract found on the selected MetaMask network. Switch to the deployed network or update the contract address."
    );
  }
}

function getResearchLoadErrorMessage(error) {
  if (error?.code === "BAD_DATA") {
    return "Could not read the ResearchLog contract. Check that MetaMask is on the correct network and frontend/src/config.js has the deployed address.";
  }

  return error?.message || "Failed to load researches";
}

function getUploadErrorMessage(error) {
  return (
    error?.reason ||
    error?.shortMessage ||
    error?.data?.message ||
    error?.info?.error?.message ||
    error?.message ||
    "Upload failed. Please try again."
  );
}

export function useResearch({ contract, account, encryptionKey, userKeyPair, setMessage, setError }) {
  const [researches, setResearches] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [coAuthor, setCoAuthor] = useState("");
  const [institution, setInstitution] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [metadataCache, setMetadataCache] = useState({});
  const [txLoading, setTxLoading] = useState(false);
  const [loadingResearches, setLoadingResearches] = useState(false);
  const [author, setAuthor] = useState("");

  // Cleanup blob URLs when researches update
  useEffect(() => {
    return () => {
      researches.forEach((r) => {
        r.versions.forEach((v) => {
          if (v.fileUrl) {
            URL.revokeObjectURL(v.fileUrl);
          }
        });
      });
    };
  }, [researches]);

  useEffect(() => {
  setResearches([]);
  setMetadataCache({});
  }, [account, encryptionKey]);

  function handleFileChange(event) {
    const selectedFile = event.target.files[0];
    if (selectedFile && !isAllowedDocument(selectedFile)) {
      alert("Only document files are allowed");
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(selectedFile);
  }

  async function createResearch() {

    if (!title || !description || !tags || !file || !institution || !category || !author) {
      alert("Please fill all required fields");
      return false;
    }
    if (!isAllowedDocument(file)) {
      alert("Only document files are allowed");
      return false;
    }
    if (!contract) {
      alert("Connect wallet first");
      return false;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

        reader.onerror = function () {
        setError("Could not read selected file");
        setMessage("");
        resolve(false);
      };

      reader.onload = async function (e) {
        try {
          const fileData = e.target.result;

          const hash = CryptoJS.SHA256(
            CryptoJS.lib.WordArray.create(fileData)
          ).toString();

          const fileHash = "0x" + hash;

          const alreadyUploadedByThisWallet = await contract.userFileExists(
            account,
            fileHash
          );

          if (alreadyUploadedByThisWallet) {
            setError("You already uploaded this exact file with this wallet.");
            setMessage("");
            resolve(false);
            return;
          }

          // Duplicate file detection
          await ensureContractHasCode(contract);
          const ids = await contract.getResearchIds();

          for (let id of ids) {
            const count = await contract.getVersionCount(id);

            for (let i = 0; i < count; i++) {
              const version = await contract.getVersion(id, i);

              if (version[1] === fileHash) {
                alert("This file has already been uploaded!");
                resolve(false);
                return;
              }
            }
          }

          if (!encryptionKey) {
            alert("Connect wallet first");
            resolve(false);
            return;
          }

          if (!userKeyPair) {
            alert("Wallet signature is required before uploading encrypted files");
            resolve(false);
            return;
          }

          // Encrypt and upload file
          const fileKey = makeFileKey();

          const base64 = arrayBufferToBase64(fileData);
          const encrypted = CryptoJS.AES.encrypt(base64, fileKey).toString();
          const blob = new Blob([encrypted], { type: "text/plain" });

          const ipfsHash = await uploadFileToIPFS(blob, "encrypted.dat");

          // Upload public version if needed
          let publicCID = null;
          if (isPublic) {
            publicCID = await uploadPublicFileToIPFS(file);
          }

          const ownerAddress = account.toLowerCase();
          const ownerPublicKey = publicKeyToBase64(userKeyPair.publicKey);
          // Build and upload metadata
          const metadata = {
            title,
            description,
            tags: tags.split(",").map((tag) => tag.trim()),
            coAuthor,
            fileType: file.type,
            fileName: file.name,
            institution,
            category,
            fileHash,
            fileCID: ipfsHash,
            timestamp: Date.now(),
            isPublic: isPublic,
            publicCID: publicCID || null,
            author,
            ownerPublicKey,
            keyAccess: {
              [ownerAddress]: encryptFileKeyForUser(
                fileKey,
                userKeyPair.publicKey,
                userKeyPair.secretKey
              )
            }
          };

          const metadataCID = await uploadMetadataToIPFS(metadata);

          setTxLoading(true);

          try {
            const tx = await contract.createResearch(metadataCID, fileHash, isPublic);

            setMessage("Transaction submitted!");
            setError("");

            await tx.wait();
            await loadResearches();

            setMessage("Research uploaded successfully!");
          } finally {
            setTxLoading(false);
          }

          // Reset form
          setTitle("");
          setAuthor("");
          setDescription("");
          setTags("");
          setCoAuthor("");
          setInstitution("");
          setCategory("");
          setFile(null);

          resolve(true);
        } catch (error) {
          console.error("Error inside reader.onload:", error);
          setError(getUploadErrorMessage(error));
          setMessage("");
          setTxLoading(false);
          resolve(false);
        }
      };
        reader.readAsArrayBuffer(file);
      });
    }

  function resetResearchForm() {
    setTitle("");
    setAuthor("");
    setDescription("");
    setTags("");
    setCoAuthor("");
    setInstitution("");
    setCategory("");
    setIsPublic(false);
    setFile(null);
  }

  async function openFile(metadataCID, fileCID, fileType, fileHash, isPublic, fileName = "research-file") {
    try {
      
      if(!account || !contract){
        alert("Connect wallet first");
        return;
      }

      if (!fileCID) {
        setError("File CID missing or corrupted");
        return;
      }
      
      const hasAccess = await contract.hasAccess(fileHash, account);

      if (!hasAccess) {
        alert("You don't have access to this file");
        return;
      }

      const downloadFileName = getDownloadFileName(fileName, fileType);
      const downloadFileType = getFileType(fileType, downloadFileName);

      if (isPublic) {
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${fileCID}`);
        const rawBlob = await response.blob();
        const blob = new Blob([rawBlob], { type: downloadFileType });

        openBlob(blob, downloadFileName);
        return;
      }

      if (!encryptionKey) {
        alert("Please sign with the connected wallet before opening private files");
        return;
      }

      const encryptedData = await fetchEncryptedFileFromIPFS(fileCID);

      if (!isCryptoJSEncryptedText(encryptedData)) {
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${fileCID}`);
        const rawBlob = await response.blob();
        const blob = new Blob([rawBlob], { type: downloadFileType });

        openBlob(blob, downloadFileName);
        return;
      }

      const metadata = await fetchMetadataFromIPFS(metadataCID);

      const encryptedFileKey = metadata.keyAccess?.[account.toLowerCase()];

      if (!encryptedFileKey) {
        throw new Error("This wallet does not have a shared file key.");
      }

      const ownerPublicKey = publicKeyFromBase64(metadata.ownerPublicKey);

      const fileKey = decryptFileKey(
        encryptedFileKey,
        ownerPublicKey,
        userKeyPair.secretKey
      );

      let decrypted = "";

      try {
        decrypted = CryptoJS.AES.decrypt(encryptedData, fileKey).toString(
          CryptoJS.enc.Utf8
        );
      } catch (decryptError) {
        throw new Error("Could not decrypt this file with the shared file key.");
      }

      if (!decrypted) {
        throw new Error("Could not decrypt this file with the shared file key.");
      }

      const binary = atob(decrypted);
      const u8 = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        u8[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([u8], { type: downloadFileType });

      openBlob(blob, downloadFileName);
    } catch (err) {
      console.warn(err);
      setError(err.message || "Cannot open file (wrong wallet, corrupted or access denied)");
      setMessage("");
    }
  }

  async function loadResearches() {
    if (!account || !contract) {
      setError("Connect wallet first");
      setMessage("");
      return;
    }

    setLoadingResearches(true);
    
    const currentAccount = account;


    try {
      await ensureContractHasCode(contract);

      const ids = await contract.getResearchIds();
      let allResearches = [];
      let ownerDisplayCounts = {};

      for (let id of ids) {
        const count = await contract.getVersionCount(id);
        let versions = [];

        const versionPromises = [];
        for (let i = 0; i < count; i++) {
          versionPromises.push(contract.getVersion(id, i));
        }

        const versionsRaw = await Promise.all(versionPromises);

        const metadataPromises = versionsRaw.map(async (version) => {
          const [ipfsHash] = version;

          if (metadataCache[ipfsHash]) {
            return { version, metadata: metadataCache[ipfsHash] };
          }

          try {
            const data = await fetchMetadataFromIPFS(ipfsHash);

            setMetadataCache((prev) => ({
              ...prev,
              [ipfsHash]: data,
            }));

            return { version, metadata: data };
          } catch (err) {
            console.warn("Metadata fetch failed:", err);
            return null;
          }
        });

        const allMetadata = await Promise.all(metadataPromises);

        for (let item of allMetadata) {
          if (!item) continue;

          const { version, metadata } = item;
          const [ipfsHash, fileHash, timestamp, uploader] = version;

          const isPublicFile = await contract.isPublicFile(fileHash);
          const publicCID =
            metadata.publicCID || (await contract.publicCIDMap(fileHash));

          try {

            const isOwner =
              uploader &&
              currentAccount &&
              uploader.toLowerCase() === currentAccount.toLowerCase();

            const hasAccess =
              isPublicFile || isOwner || (await contract.hasAccess(fileHash, currentAccount));

            if (!hasAccess) continue;

            if (metadata.fileCID || publicCID) {
              versions.push({
                metadataCID: ipfsHash,
                fileType: metadata.fileType,
                fileName: metadata.fileName || metadata.title || "research-file",
                fileCID: metadata.fileCID || null,
                title: metadata.title,
                author: metadata.author || metadata.coAuthor || uploader,
                description: hasAccess ? metadata.description : "",
                fileHash: fileHash,
                uploader: uploader,
                timestamp: timestamp.toString(),
                coAuthor: metadata.coAuthor,
                isPublic: isPublicFile,
                publicCID: publicCID,
                hasAccess: hasAccess,
                institution: metadata.institution,
                category: metadata.category,
                tags: metadata.tags,
              });
            }
          } catch (error) {
            console.warn("ERROR LOADING VERSION:", error);
          }
        }

        if (versions.length > 0) {
          const owner = versions[0].uploader?.toLowerCase();
          let ownerResearchNumber = null;

          try {
            const research = await contract.researches(id);
            ownerResearchNumber = Number(research.ownerResearchNumber);
          } catch (err) {
            if (owner) {
              ownerDisplayCounts[owner] = (ownerDisplayCounts[owner] || 0) + 1;
              ownerResearchNumber = ownerDisplayCounts[owner];
            }
          }

          allResearches.push({
            id: id.toString(),
            ownerResearchNumber: ownerResearchNumber?.toString() || id.toString(),
            versions: versions,
          });
        }
      }

      setResearches(allResearches);
      setLoadingResearches(false);
    } catch (error) {
      console.error(error);
      setError(getResearchLoadErrorMessage(error));
      setMessage("");
      setLoadingResearches(false);
    }
  }

  async function grantAccess(researchId, versionIndex, metadataCID, fileHash, userAddress) {
    try {
      if (!account || !contract) {
        alert("Connect wallet first");
        return;
      }

      if (!userAddress || userAddress.trim() === "") {
        alert("Enter address to share");
        return;
      }

      if (!userKeyPair) {
        alert("Wallet signature is required before sharing encrypted files");
        return;
      }

      const recipientAddress = userAddress.trim().toLowerCase();
      const ownerAddress = account.toLowerCase();

      const metadata = await fetchMetadataFromIPFS(metadataCID);
      const ownerEncryptedFileKey = metadata.keyAccess?.[ownerAddress];

      if (!ownerEncryptedFileKey || !metadata.ownerPublicKey) {
        throw new Error("This file does not have shareable encryption metadata");
      }

      const recipientPublicKey = await contract.userPublicKey(recipientAddress);

      if (!recipientPublicKey) {
        throw new Error("Recipient must register their public key before you can share encrypted files with them");
      }

      const fileKey = decryptFileKey(
        ownerEncryptedFileKey,
        publicKeyFromBase64(metadata.ownerPublicKey),
        userKeyPair.secretKey
      );

      const updatedMetadata = {
        ...metadata,
        keyAccess: {
          ...(metadata.keyAccess || {}),
          [recipientAddress]: encryptFileKeyForUser(
            fileKey,
            publicKeyFromBase64(recipientPublicKey),
            userKeyPair.secretKey
          ),
        },
      };

      const updatedMetadataCID = await uploadMetadataToIPFS(updatedMetadata);

      setTxLoading(true);

      const metadataTx = await contract.updateVersionMetadata(
        researchId,
        versionIndex,
        updatedMetadataCID
      );
      await metadataTx.wait();

      const accessTx = await contract.grantAccess(fileHash, userAddress.trim());
      await accessTx.wait();

      await loadResearches();

      alert("File shared successfully!");
      setMessage("");
      setError("");
      setTxLoading(false);
    } catch (err) {
      console.error(err);

      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction cancelled");
      } else {
        setError(err.message || "Failed to share file");
      }

      setMessage("");
      setTxLoading(false);
    }
  }

  async function revokeAccess(fileHash, userAddress) {
    try {
      if (!account || !contract) {
        alert("Connect wallet first");
        return;
      }

      if (!userAddress || userAddress.trim() === "") {
        alert("Enter address to remove");
        return;
      }

      setTxLoading(true);

      const tx = await contract.revokeAccess(fileHash, userAddress);
      await tx.wait();

      await loadResearches();

      setMessage("Access removed successfully!");
      setError("");
      setTxLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to remove access");
      setMessage("");
      setTxLoading(false);
    }
  }

  async function toggleVisibility(v) {
    try {
      if(!account || !contract){
        alert("Connect wallet first");
        return;
      }

      if (v.isPublic) {
        setTxLoading(true);
        const tx = await contract.setVisibility(v.fileHash, false, "");
        setMessage("Transaction submitted!");
        setError("");
        await tx.wait();
        await loadResearches();
        setTxLoading(false);
        setMessage("Visibility updated");
        setError("");
        return;
      }

      if (!v.isPublic) {
        if (v.publicCID && v.publicCID !== "") {         
          setTxLoading(true);
          const tx = await contract.setVisibility(v.fileHash, true, "");
          setMessage("Transaction submitted!");
          setError("");
          await tx.wait();
          await loadResearches();
          setTxLoading(false);
          setMessage("Visibility updated");
          return;
        }

        // No existing publicCID — prompt user to upload public version
        const input = document.createElement("input");
        input.type = "file";

        input.onchange = async (e) => {
          const selectedFile = e.target.files[0];
          if (!selectedFile) return;

          setTxLoading(true);
          const publicCID = await uploadPublicFileToIPFS(selectedFile);
          const tx = await contract.setVisibility(v.fileHash, true, publicCID);
          setMessage("Transaction submitted!");
          setError("");
          await tx.wait();
          await loadResearches();

          setMessage("Visibility updated");
          setError("");
          setTxLoading(false);
        };

        input.click();
      }
    } catch (err) {
      console.error(err);
      setError("Error updating visibility");
      setMessage("");
      setTxLoading(false);
    }
  }

  return {
    // State
    researches,
    file,
    title, setTitle,
    author, setAuthor,
    description, setDescription,
    tags, setTags,
    coAuthor, setCoAuthor,
    institution, setInstitution,
    category, setCategory,
    isPublic, setIsPublic,
    txLoading,
    loadingResearches,
    // Actions
    handleFileChange,
    createResearch,
    openFile,
    loadResearches,
    grantAccess,
    revokeAccess,
    toggleVisibility,
    resetResearchForm
  };
}
