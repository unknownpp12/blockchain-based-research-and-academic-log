import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ResearchLog from "./contracts/ResearchLog.json";
import { CONTRACT_ADDRESS } from "./config";
import CryptoJS from "crypto-js";
import axios from "axios";

function App() {

  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [researches, setResearches] = useState([]);
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [coAuthor, setCoAuthor] = useState("");
  const [institution, setInstitution] = useState("");
  const [category, setCategory] = useState("");
  const [citationFormat, setCitationFormat] = useState("APA");
  const [isPublic, setIsPublic] = useState(false);
  const [shareAddress, setShareAddress] = useState("");
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [metadataCache, setMetadataCache] = useState({});
  
//   useEffect(() => {
//   const disableRightClick = (e) => {
//     e.preventDefault();
//   };

//   const disableSave = (e) => {
//     if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
//       e.preventDefault();
//     }
//   };

//   document.addEventListener("contextmenu", disableRightClick);
//   document.addEventListener("keydown", disableSave);

//   return () => {
//     document.removeEventListener("contextmenu", disableRightClick);
//     document.removeEventListener("keydown", disableSave);
//   };
// }, []);

    useEffect(() => {
      return () => {
        researches.forEach(r => {
          r.versions.forEach(v => {
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

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not installed");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setAccount(accounts[0]);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const signature = await signer.signMessage("research-encryption-key");
    const key = CryptoJS.SHA256(signature).toString();

    setEncryptionKey(key);

    const contractInstance = new ethers.Contract(
      CONTRACT_ADDRESS,
      ResearchLog.abi,
      signer
    );

    setContract(contractInstance);

    console.log("Contract connected:", contractInstance);
  }

  function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
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

  try{
    
    const fileData = e.target.result;

    const hash = CryptoJS.SHA256(
      CryptoJS.lib.WordArray.create(fileData)
    ).toString();

    const fileHash = "0x" + hash;

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

    const key = encryptionKey;

    const base64 = arrayBufferToBase64(fileData);
    const encrypted = CryptoJS.AES.encrypt(base64, key).toString();

    const blob = new Blob([encrypted], { type: "text/plain" });

    const formData = new FormData();
    formData.append("file", blob, "encrypted.dat");
    
    const response = await axios.post(
      "http://localhost:5000/upload-file",
      formData
    );

    const ipfsHash = response.data.IpfsHash;
    
    console.log("IPFS CID:", ipfsHash);

    let publicCID = null;

    if (isPublic) {
      const publicFormData = new FormData();
      publicFormData.append("file", file); // original file

      const publicRes = await axios.post(
        "http://localhost:5000/upload-file",
        publicFormData
      );

      publicCID = publicRes.data.IpfsHash;

      console.log("Public CID:", publicCID);
    }
    
    const metadata = {
      title,
      description,
      tags: tags.split(",").map(tag => tag.trim()),
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

    const metadataResponse = await axios.post(
      "http://localhost:5000/upload-json",
      metadata
    );

    const metadataCID = metadataResponse.data.IpfsHash;
    
    console.log("Metadata CID:", metadataCID);
    const tx = await contract.createResearch(metadataCID, fileHash, isPublic);

    console.log("Transaction sent:", tx.hash);

    await tx.wait();

    console.log("Transaction confirmed");

    setShowForm(false);

    setTitle("");
    setDescription("");
    setTags("");
    setCoAuthor("");
    setInstitution("");
    setCategory("");
    }

    catch(error){
      console.error("Error inside reader.onload:",error);
    }
  };

      reader.readAsArrayBuffer(file);

  } catch (error) {
    console.error("Outer error:",error);
  }
}

async function openFile(fileCID, fileType, fileHash) {
  try {

    const hasAccess = await contract.hasAccess(fileHash, account);

    if (!hasAccess) {
      alert("You don't have access to this file");
      return;
    }

    if (!encryptionKey) {
      alert("Connect wallet first");
      return;
    }

    const key = encryptionKey;

    const res = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${fileCID}`,
      { responseType: "text" }
    );

    const encryptedData = res.data;

    const decrypted = CryptoJS.AES.decrypt(encryptedData, key)
      .toString(CryptoJS.enc.Utf8);

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
    alert("Cannot open file (wrong wallet, corrupted or access denied)");
  }
}

  async function loadResearches() {
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
          return {
            version,
            metadata: metadataCache[ipfsHash]
          };
        }

        try {
          const res = await axios.get(
            `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            { responseType: "json", timeout: 10000 }
          );

          setMetadataCache(prev => ({
                ...prev,
                [ipfsHash]: res.data
              }));

          return {
            version,
            metadata: res.data
          };
        } catch (err) {
          console.warn("Metadata fetch failed:", err);
          return null;
        }
      });

      const allMetadata = await Promise.all(metadataPromises);

      for (let item of allMetadata) {
        if(!item) continue;

        const { version, metadata } = item;

        const [ipfsHash, fileHash, timestamp, uploader] = version;

        const isPublic = await contract.isPublicFile(fileHash);
        const publicCID = await contract.publicCIDMap(fileHash);

        console.log("Version:", version);
        
        try {

          console.log("Uploader:", uploader);
          
          const hash = fileHash;
          
          const time = Number(timestamp);

        if (!firstUploadMap[hash]) {
          firstUploadMap[hash] = {
            uploader: uploader,
            timestamp: time,
          };
        } else {
          if (time < firstUploadMap[hash].timestamp) {
            firstUploadMap[hash] = {
              uploader: uploader,
              timestamp: time,
            };
          }
        }
      console.log("Metadata:",metadata);

        if(metadata.fileCID ){
        versions.push({
          metadataCID: ipfsHash,
          fileType: metadata.fileType,
          fileCID: metadata.fileCID,
          title: metadata.title,
          description: metadata.description,
          fileHash: fileHash,
          uploader: uploader,
          firstUploader: firstUploadMap[hash]?.uploader || "Unknown",
          timestamp: timestamp.toString(),
          coAuthor: metadata.coAuthor,
          isPublic: isPublic,
          publicCID: publicCID,
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

  } catch (error) {
    console.error(error);
  }
}

  async function grantAccess(fileHash, userAddress) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.grantAccess(fileHash, userAddress);
      await tx.wait();

      alert("Access granted!");
    } catch (err) {
      console.error(err);
      alert("Error granting access");
    }
  }

  async function toggleVisibility(v) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      if (v.isPublic) {
        const tx = await contractWithSigner.setVisibility(
          v.fileHash,
          false,
          ""
        );
        await tx.wait();

        alert("Set to private");
        return;
      }

      if (!v.isPublic) {

        if (v.publicCID && v.publicCID !== "") {
          const tx = await contractWithSigner.setVisibility(
            v.fileHash,
            true,
            ""
          );

          await tx.wait();

          alert("Set to public (no re-upload needed)");
          return;
        }

        const input = document.createElement("input");
        input.type = "file";

        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append("file", file);

          const res = await axios.post(
            "http://localhost:5000/upload-file",
            formData
          );

          const publicCID = res.data.IpfsHash;

          const tx = await contractWithSigner.setVisibility(
            v.fileHash,
            true,
            publicCID
          );

          await tx.wait();

          alert("Set to public");
        };

        input.click();
      }

    } catch (err) {
      console.error(err);
      alert("Error updating visibility");
    }
  }

function generateCitation(v, format = "APA") {
  const year = new Date(Number(v.timestamp)).getFullYear();

  const author = v.coAuthor && v.coAuthor.trim() !== ""
    ? v.coAuthor
    : v.uploader || "Unknown Author";

  const title = v.title || "Untitled";
  const source = "ResearchLog DApp";
  const link = v.isPublic && v.publicCID ? `https://gateway.pinata.cloud/ipfs/${v.publicCID}`
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
  return (
    <div style={{ padding: "20px" }}
      onContextMenu={(e) => e.preventDefault()}>
      <h1>Research Log DApp</h1>

      <button onClick={connectWallet}>
        Connect MetaMask
      </button>

      <p>Connected Account: {account}</p>

      <button onClick={() => setShowForm(true)}>
      Add Research
      </button>

      <button onClick={loadResearches}>
      Load Researches
      </button>
      {showForm && (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)"
  }}>
    <div style={{
      background: "white",
      padding: "20px",
      margin: "50px auto",
      width: "400px"
    }}>
      <h2>Add Research</h2>

      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
      <input placeholder="Tags (comma separated)" onChange={(e) => setTags(e.target.value)} />
      <input placeholder="Co-author" onChange={(e) => setCoAuthor(e.target.value)} />
      <input placeholder="Institution" onChange={(e) => setInstitution(e.target.value)} />
      <input placeholder="Category" onChange={(e) => setCategory(e.target.value)} />

      <label>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        Make Public
      </label>

      <input type="file" onChange={handleFileChange} />
      <button
        onClick={createResearch}
        disabled={
          !title || !description || !tags || !file || !institution || !category
        }
      >
        Submit
      </button>
      <button onClick={() => setShowForm(false)}>Close</button>
      </div>
    </div>
)}
      {researches.map((r) => (
      <div key={r.id} style={{ marginTop: "20px" }}>
      <h3>Research {r.id}</h3>

      {r.versions.map((v, index) => (
      <div key={index}>
        <p>Version {index + 1}</p>
      <p>Title: {v.title}</p>
      <p>Description: {v.description}</p>
      {index === 0 && (
        <p>Original Uploader: {v.firstUploader || "N/A"}</p>
      )}
      <p>Uploaded By: {v.uploader || "N/A"}</p>
      <p>Access: {v.isPublic ? "Public": v.uploader === account ? "Owner" : "Restricted" }</p>
      <p>Type: {v.fileType} </p>
      <input
        placeholder="Share with address"
        onChange={(e) => setShareAddress(e.target.value)}
      />

      <button onClick={() => grantAccess(v.fileHash, shareAddress)}>
        Share
      </button>

      <button onClick={() => toggleVisibility(v)}>
        {v.isPublic ? "Make Private" : "Make Public"}
      </button>

      <button
        disabled={!v.isPublic && v.uploader !== account}
        onClick={() => openFile(v.fileCID, v.fileType, v.fileHash)}
      >
        Open File
      </button>

      <button
        onClick={() => {
          const citation = generateCitation(v, citationFormat);
          navigator.clipboard.writeText(citation);
          alert(`${citationFormat} citation copied!`);
        }}>
        Copy Citation
      </button>
      <select
        value={citationFormat}
        onChange={(e) => setCitationFormat(e.target.value)}>
        <option value="APA">APA</option>
        <option value="MLA">MLA</option>
        <option value="IEEE">IEEE</option>
      </select>
      <p style={{ fontSize: "12px", color: "gray" }}>
        {generateCitation(v, citationFormat)}
      </p>
      <p style={{ fontSize: "12px", color: "gray" }}>
        {v.isPublic ? "Publicly accessible" : "Accessible only via ResearchLog app"}
      </p>
        <p>Hash: {v.fileHash}</p>
        <p>Timestamp: {v.timestamp}</p>
      </div>
    ))}
      </div>
))}

    </div>
  );
}

export default App;