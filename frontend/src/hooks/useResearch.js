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

  function handleFileChange(event) {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  }

  async function createResearch() {
    const confirmUpload = window.confirm(
      "Do you want to upload this research to IPFS first and only to blockchain after transaction confirmation?"
    );

    if (!confirmUpload) return;
    if (!title || !description || !tags || !file || !institution || !category) {
      alert("Please fill all required fields");
      return;
    }
    if (!contract) {
      alert("Connect wallet first");
      return;
    }

    try {
      const reader = new FileReader();

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
                return;
              }
            }
          }

          if (!encryptionKey) {
            alert("Connect wallet first");
            return;
          }

          // Encrypt and upload file
          const base64 = arrayBufferToBase64(fileData);
          const encrypted = CryptoJS.AES.encrypt(base64, encryptionKey).toString();
          const blob = new Blob([encrypted], { type: "text/plain" });

          const ipfsHash = await uploadFileToIPFS(blob, "encrypted.dat");
          console.log("IPFS CID:", ipfsHash);

          // Upload public version if needed
          let publicCID = null;
          if (isPublic) {
            publicCID = await uploadPublicFileToIPFS(file);
            console.log("Public CID:", publicCID);
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
          };

          const metadataCID = await uploadMetadataToIPFS(metadata);
          console.log("Metadata CID:", metadataCID);

          setTxLoading(true);

          const tx = await contract.createResearch(metadataCID, fileHash, isPublic);

          setMessage("Transaction submitted!");
          setError("");
          setTxLoading(false);

          tx.wait().then(() => {
            alert("Transaction confirmed!");
          });

          console.log("Transaction sent:", tx.hash);

          // Reset form
          setTitle("");
          setDescription("");
          setTags("");
          setCoAuthor("");
          setInstitution("");
          setCategory("");

          return true; // Signal success to close the modal
        } catch (error) {
          console.error("Error inside reader.onload:", error);
          setError("Upload failed. Please try again.");
          setMessage("");
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Outer error:", error);
    }
  }

  async function openFile(fileCID, fileType, fileHash, isPublic) {
    try {
      const hasAccess = await contract.hasAccess(fileHash, account);

      if (!fileCID) {
        setError("File CID missing or corrupted");
        return;
      }

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
        alert("Connect wallet first");
        return;
      }

      const encryptedData = await fetchEncryptedFileFromIPFS(fileCID);

      const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(
        CryptoJS.enc.Utf8
      );

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
      console.error(err);
      setError("Cannot open file (wrong wallet, corrupted or access denied)");
      setMessage("");
    }
  }

  async function loadResearches() {
    setLoadingResearches(true);
    let firstUploadMap = {};

    if (!contract) {
      alert("Connect wallet first");
      return;
    }

    try {
      const ids = await contract.getResearchIds();
      let allResearches = [];

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

          console.log("Version:", version);

          try {
            console.log("Uploader:", uploader);

            const hash = fileHash;
            const time = Number(timestamp);

            if (!firstUploadMap[hash]) {
              firstUploadMap[hash] = { uploader, timestamp: time };
            } else if (time < firstUploadMap[hash].timestamp) {
              firstUploadMap[hash] = { uploader, timestamp: time };
            }

            console.log("Metadata:", metadata);
            const hasAccess = await contract.hasAccess(fileHash, account);

            if (metadata.fileCID || publicCID) {
              versions.push({
                metadataCID: ipfsHash,
                fileType: metadata.fileType,
                fileCID: metadata.fileCID || null,
                title: metadata.title,
                description: hasAccess ? metadata.description : "",
                fileHash: fileHash,
                uploader: uploader,
                firstUploader: firstUploadMap[hash]?.uploader || "Unknown",
                timestamp: timestamp.toString(),
                coAuthor: metadata.coAuthor,
                isPublic: isPublicFile,
                publicCID: publicCID,
                hasAccess: hasAccess,
              });
            }
          } catch (error) {
            console.warn("ERROR LOADING VERSION:", error);
          }
        }

        if (versions.length > 0) {
          allResearches.push({
            id: id.toString(),
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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.grantAccess(fileHash, userAddress);
      setTxLoading(true);

      alert("Transaction submitted!");
      setTxLoading(false);

      tx.wait().then(() => {
        setMessage("Access granted!");
        setError("");
      });

      setMessage("Access granted!");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error granting access");
      setMessage("");
    }
  }

  async function toggleVisibility(v) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      if (v.isPublic) {
        const tx = await contractWithSigner.setVisibility(v.fileHash, false, "");
        setTxLoading(true);
        alert("Transaction submitted!");
        setTxLoading(false);
        tx.wait().then(() => alert("Visibility updated!"));
        setMessage("Visibility updated");
        setError("");
        return;
      }

      if (!v.isPublic) {
        if (v.publicCID && v.publicCID !== "") {
          const tx = await contractWithSigner.setVisibility(v.fileHash, true, "");
          setTxLoading(true);
          alert("Transaction submitted!");
          setTxLoading(false);
          tx.wait().then(() => alert("Visibility updated!"));
          setMessage("Visibility updated");
          setError("");
          return;
        }

        // No existing publicCID — prompt user to upload public version
        const input = document.createElement("input");
        input.type = "file";

        input.onchange = async (e) => {
          const selectedFile = e.target.files[0];
          if (!selectedFile) return;

          const publicCID = await uploadPublicFileToIPFS(selectedFile);
          const tx = await contractWithSigner.setVisibility(v.fileHash, true, publicCID);
          await tx.wait();

          setMessage("Visibility updated");
          setError("");
        };

        input.click();
      }
    } catch (err) {
      console.error(err);
      setError("Error updating visibility");
      setMessage("");
    }
  }

  return {
    // State
    researches,
    file,
    title, setTitle,
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
  };
}
