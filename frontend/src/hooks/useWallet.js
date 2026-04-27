import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import ResearchLog from "../contracts/ResearchLog.json";
import { CONTRACT_ADDRESS } from "../config";

export function useWallet() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);

  // Auto-connect if wallet is already authorized
  useEffect(() => {
    async function autoConnect() {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const signer = await provider.getSigner();

          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            ResearchLog.abi,
            signer
          );

          setAccount(accounts[0].address);
          setContract(contractInstance);
        }
      } catch (err) {
        console.error("Auto connect failed:", err);
      }
    }

    autoConnect();
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please open this app inside MetaMask mobile browser");
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

  return { account, contract, encryptionKey, connectWallet };
}
