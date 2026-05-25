import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import {
  uploadFileToIPFS,
  uploadPublicFileToIPFS,
  uploadMetadataToIPFS,
  fetchMetadataFromIPFS,
  fetchEncryptedFileFromIPFS,
} from "../services/ipfsService";
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

function isAllowedDocument(file) {
  const fileName = file?.name?.toLowerCase() || "";
  return ALLOWED_DOCUMENT_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension)
  );
}

export function useResearch({ contract, account, encryptionKey, setMessage, setError }) {
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

          // Duplicate file detection
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

          // Encrypt and upload file
          const base64 = arrayBufferToBase64(fileData);
          const encrypted = CryptoJS.AES.encrypt(base64, encryptionKey).toString();
          const blob = new Blob([encrypted], { type: "text/plain" });

          const ipfsHash = await uploadFileToIPFS(blob, "encrypted.dat");

          // Upload public version if needed
          let publicCID = null;
          if (isPublic) {
            publicCID = await uploadPublicFileToIPFS(file);
          }

          // Build and upload metadata
          const metadata = {
            title,
            description,
            tags: tags.split(",").map((tag) => tag.trim()),
            coAuthor,
            fileType: file.type,
            institution,
            category,
            fileHash,
            fileCID: ipfsHash,
            timestamp: Date.now(),
            isPublic: isPublic,
            publicCID: publicCID || null,
            author
          };

          const metadataCID = await uploadMetadataToIPFS(metadata);

          setTxLoading(true);

          const tx = await contract.createResearch(metadataCID, fileHash, isPublic);

          setMessage("Transaction submitted!");
          setError("");

          await tx.wait();
          await loadResearches();

          setMessage("Research uploaded successfully!");
          setTxLoading(false);

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
          setError("Upload failed. Please try again.");
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

  async function openFile(fileCID, fileType, fileHash, isPublic) {
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

      if (isPublic) {
        window.open(
          `https://gateway.pinata.cloud/ipfs/${fileCID}`,
          "_blank"
        );
        return;
      }

      if (!encryptionKey) {
        alert("Please sign with the connected wallet before opening private files");
        return;
      }

      const encryptedData = await fetchEncryptedFileFromIPFS(fileCID);

      let decrypted = "";

      try {
        decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(
          CryptoJS.enc.Utf8
        );
      } catch (decryptError) {
        throw new Error("Private file could not be decrypted with this wallet signature");
      }

      if (!decrypted) throw new Error("Decryption failed");

      const binary = atob(decrypted);
      const u8 = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        u8[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([u8], { type: fileType });
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");
    } catch (err) {
      console.warn(err);
      setError("Cannot open file (wrong wallet, corrupted or access denied)");
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
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const currentAccount = await signer.getAddress();


    try {
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
            ownerResearchNumber = Number(await contract.getOwnerResearchNumber(id));
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
      setError("Failed to load researches");
      setMessage("");
      setLoadingResearches(false);
    }
  }

  async function grantAccess(fileHash, userAddress) {
    try {
      if(!account || !contract){
        alert("Connect wallet first");
        return;
      }

      if (!userAddress || userAddress.trim() === "") {
        alert("Enter address to share");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      setTxLoading(true);

      const tx = await contractWithSigner.grantAccess(fileHash, userAddress);
      
      await tx.wait();

      alert("✅ File shared successfully!");
      setMessage("");
      setError("");

      setTxLoading(false);

    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
      setError("Transaction cancelled");
    } else {
      setError("Failed to share file");
    }

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

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      if (v.isPublic) {
        setTxLoading(true);
        const tx = await contractWithSigner.setVisibility(v.fileHash, false, "");
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
          const tx = await contractWithSigner.setVisibility(v.fileHash, true, "");
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
          const tx = await contractWithSigner.setVisibility(v.fileHash, true, publicCID);
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
    toggleVisibility,
    resetResearchForm
  };
}
