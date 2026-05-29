import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import ResearchLog from "../contracts/ResearchLog.json";
import { CONTRACT_ADDRESS } from "../config";
import { makeUserKeyPair, publicKeyToBase64 } from "../utils/cryptoAccess";

async function ensureContractIsDeployed(provider) {
  const code = await provider.getCode(CONTRACT_ADDRESS);

  if (code === "0x") {
    const network = await provider.getNetwork();
    throw new Error(
      `No ResearchLog contract found at ${CONTRACT_ADDRESS} on chain ${network.chainId}. Switch MetaMask to the deployed network or update frontend/src/config.js.`
    );
  }
}

export function useWallet() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [hasAuthorizedWallet, setHasAuthorizedWallet] = useState(false);
  const [userKeyPair, setUserKeyPair] = useState(null);
  const [registeringSharingKey, setRegisteringSharingKey] = useState(false);

  async function activateWallet(selectedAccount) {
    setAccount(selectedAccount);
    setContract(null);
    setEncryptionKey(null);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const normalizedAccount = signerAddress || selectedAccount;

    setAccount(normalizedAccount);

    await ensureContractIsDeployed(provider);

    const signature = await signer.signMessage("research-encryption-key");
    const key = CryptoJS.SHA256(signature).toString();
    const keyPair = makeUserKeyPair(signature);
    setUserKeyPair(keyPair);

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
        console.error("Wallet activation failed:", err);
        setContract(null);
        setEncryptionKey(null);
        setHasAuthorizedWallet(false);
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

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      await activateWallet(accounts[0]);
      setHasAuthorizedWallet(true);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert(err.message || "Wallet connection failed");
      setAccount("");
      setContract(null);
      setEncryptionKey(null);
      setHasAuthorizedWallet(false);
    }

  }

  async function registerSharingKey() {
    if (!account || !contract || !userKeyPair) {
      alert("Connect wallet first");
      return false;
    }

    try {
      setRegisteringSharingKey(true);

      const currentPublicKey = await contract.userPublicKey(account);

      if (currentPublicKey) {
        alert("Sharing key is already registered");
        return true;
      }

      const tx = await contract.setPublicKey(publicKeyToBase64(userKeyPair.publicKey));
      await tx.wait();

      alert("Sharing key registered successfully");
      return true;
    } catch (err) {
      console.error("Sharing key registration failed:", err);

      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        alert("Transaction cancelled");
      } else {
        alert(err.message || "Failed to register sharing key");
      }

      return false;
    } finally {
      setRegisteringSharingKey(false);
    }
  }

  return {
    account,
    contract,
    encryptionKey,
    userKeyPair,
    connectWallet,
    registerSharingKey,
    registeringSharingKey,
    hasAuthorizedWallet,
  };
}
