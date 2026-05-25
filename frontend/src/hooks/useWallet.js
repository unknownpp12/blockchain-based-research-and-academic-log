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

  async function activateWallet(selectedAccount) {
    setAccount(selectedAccount);
    setContract(null);
    setEncryptionKey(null);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const normalizedAccount = signerAddress || selectedAccount;

    setAccount(normalizedAccount);

    const signature = await signer.signMessage("research-encryption-key");
    const key = CryptoJS.SHA256(signature).toString();

    const contractInstance = new ethers.Contract(
      CONTRACT_ADDRESS,
      ResearchLog.abi,
      signer
    );

    setEncryptionKey(key);
    setContract(contractInstance);
    return contractInstance;
  }

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setContract(null);
        setEncryptionKey(null);
        return;
      }

      try {
        await activateWallet(accounts[0]);
        setHasAuthorizedWallet(true);
      } catch (err) {
        console.error("Wallet signature failed:", err);
        setContract(null);
        setEncryptionKey(null);
      }
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

    await activateWallet(accounts[0]);
    setHasAuthorizedWallet(true);

  }

  return { account, contract, encryptionKey, connectWallet, hasAuthorizedWallet };
}
