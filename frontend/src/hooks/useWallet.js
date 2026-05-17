import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import ResearchLog from "../contracts/ResearchLog.json";
import { CONTRACT_ADDRESS } from "../config";

export function useWallet() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [hasAuthorizedWallet, setHasAuthorizedWallet] = useState(false);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setContract(null);
        setEncryptionKey(null);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        ResearchLog.abi,
        signer
      );

      setAccount(accounts[0]);
      setContract(contractInstance);

      const signature = await signer.signMessage("research-encryption-key");
      const key = CryptoJS.SHA256(signature).toString();
      setEncryptionKey(key);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  useEffect(() => {
  async function checkAuthorized() {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        setHasAuthorizedWallet(true); // wallet previously connected
      } else {
        setHasAuthorizedWallet(false);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  }

  checkAuthorized();
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

  }

  return { account, contract, encryptionKey, connectWallet, hasAuthorizedWallet };
}
