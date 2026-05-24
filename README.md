# Blockchain-Based Research and Academic Log

A decentralized application for securely recording, versioning, sharing, and verifying academic research files using Ethereum smart contracts, IPFS storage, wallet-based access control, and encrypted file handling.

## Project Context

This project was developed as a BIT project defense system to address a common academic problem: research work is often stored in centralized platforms where file ownership, timestamp proof, version history, and controlled access are difficult to verify independently.

The system provides a blockchain-backed academic log where researchers can upload research files, preserve proof of originality through file hashes, maintain version history, and share private files with selected wallet addresses. Instead of storing large files directly on-chain, the project stores files and metadata on IPFS and stores only essential verification and access data on the Ethereum blockchain.

## Problem Statement

Academic and research files are commonly stored in centralized drives, emails, or local devices. These methods create several issues:

- It is difficult to prove when a research file was first uploaded.
- It is difficult to verify whether a file has been changed.
- Version history may be lost or manually manipulated.
- File access often depends on centralized accounts or manual sharing.
- Research ownership proof is weak without a trusted timestamp and file fingerprint.

This project solves these issues by combining blockchain immutability, IPFS content addressing, cryptographic hashing, and wallet-based identity.

## Objectives

- To create a decentralized research logging system for academic files.
- To record research ownership, timestamps, file hashes, and version history on blockchain.
- To store large files and metadata on IPFS instead of storing them directly on-chain.
- To support private encrypted uploads and public research visibility.
- To allow research owners to grant access to selected wallet addresses.
- To provide citation generation for uploaded research records.
- To demonstrate practical integration of smart contracts, frontend, backend, and decentralized storage.

## Core Features

- Wallet connection using MetaMask.
- Research file upload with metadata such as title, author, institution, category, tags, and description.
- SHA-256 file hashing for file fingerprinting.
- AES encryption for private files before IPFS upload.
- Public file upload option for openly accessible research.
- IPFS storage through Pinata.
- Smart contract record keeping for research IDs, file hashes, versions, visibility, timestamps, and access permissions.
- Research versioning through the smart contract.
- Owner-based sharing using Ethereum wallet addresses.
- Public/private visibility toggle.
- Research list separated into own files and accessible shared files.
- Citation generation in APA, MLA, and IEEE formats.

## System Architecture

The project is divided into three main layers:

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, Tailwind CSS, ethers.js, CryptoJS | User interface, wallet connection, encryption, file handling, blockchain interaction |
| Backend | Node.js, Express, Multer, Axios | Secure upload bridge between frontend and Pinata/IPFS |
| Blockchain | Solidity, Hardhat, Ethereum Sepolia | Immutable research records, access control, version tracking |
| Storage | IPFS via Pinata | Stores encrypted files, public files, and metadata JSON |

### High-Level Flow

```text
User
  -> React frontend
  -> MetaMask wallet
  -> Backend API
  -> Pinata/IPFS
  -> Ethereum smart contract
```

## How the System Works

1. The user connects a MetaMask wallet.
2. The frontend creates a wallet-based encryption key by asking the user to sign a message.
3. The user fills in research details and selects a research file.
4. The file is hashed using SHA-256 to create a unique file fingerprint.
5. If the file is private, it is encrypted in the browser before upload.
6. The file is uploaded to IPFS through the backend and Pinata.
7. Metadata is uploaded to IPFS as JSON.
8. The smart contract stores the metadata CID, file hash, owner, timestamp, visibility, and version information.
9. When records are loaded, the frontend reads contract data and fetches metadata from IPFS.
10. Access is checked through the smart contract before private files can be opened.

## Technology Stack

### Blockchain

- Solidity `0.8.28`
- Hardhat
- Ethereum Sepolia test network
- ethers.js

### Frontend

- React
- Tailwind CSS
- CryptoJS
- Axios
- MetaMask provider API

### Backend

- Node.js
- Express
- Multer
- CORS
- dotenv
- form-data
- Axios

### Storage

- IPFS
- Pinata API
- Pinata public gateway

## Smart Contract Overview

Main contract:

```text
contracts/ResearchLog.sol
```

The `ResearchLog` contract manages research records and file access.

### Important Contract Structures

```solidity
struct Version {
    string ipfsHash;
    bytes32 fileHash;
    uint256 timestamp;
    address uploader;
}
```

Each `Version` stores:

- IPFS CID for metadata.
- File hash for verification.
- Upload timestamp.
- Wallet address of uploader.

```solidity
struct Research {
    uint256 id;
    address author;
    uint256 ownerResearchNumber;
    Version[] versions;
}
```

Each `Research` stores:

- Research ID.
- Original author wallet.
- Owner-specific research number.
- List of versions.

### Main Smart Contract Functions

| Function | Purpose |
|---|---|
| `createResearch()` | Creates a new research record with version 1 |
| `addVersion()` | Adds a new version to an existing research record |
| `grantAccess()` | Gives another wallet access to a private file |
| `revokeAccess()` | Removes file access from a wallet |
| `hasAccess()` | Checks whether a user can access a file |
| `setVisibility()` | Changes a file between public and private |
| `getVersion()` | Returns version details |
| `getVersionCount()` | Returns number of versions for a research item |
| `getResearchIds()` | Returns all research IDs |

## Backend API

Backend entry point:

```text
backend/index.js
```

The backend protects Pinata API keys and provides upload routes.

| Route | Method | Purpose |
|---|---|---|
| `/upload-file` | POST | Uploads encrypted or public files to IPFS |
| `/upload-json` | POST | Uploads metadata JSON to IPFS |

The frontend does not directly expose Pinata API credentials. Instead, it sends file and metadata requests to the backend, and the backend communicates with Pinata.

## Frontend Overview

Frontend source:

```text
frontend/src
```

Important files:

| File | Purpose |
|---|---|
| `App.js` | Main app coordinator |
| `hooks/useWallet.js` | Wallet connection and contract setup |
| `hooks/useResearch.js` | Upload, load, access, encryption, decryption, and visibility logic |
| `hooks/useNotification.js` | Success and error messages |
| `services/ipfsService.js` | Backend and IPFS request functions |
| `utils/helpers.js` | Base64 conversion and citation generation |
| `Designcomponents/*` | UI components for navbar, hero, modal, list, and cards |

## Security and Integrity

This project uses several security and verification mechanisms:

- File hashing using SHA-256 to detect duplicates and verify file identity.
- AES encryption for private files before IPFS upload.
- Wallet-based authentication through MetaMask.
- Smart contract access control using wallet addresses.
- Public/private visibility tracking on-chain.
- IPFS CID storage for content-addressed retrieval.
- Environment variables for private API keys and deployment credentials.

## Installation and Setup

### Prerequisites

- Node.js
- npm
- MetaMask wallet
- Pinata account
- Infura or another Sepolia RPC provider
- Sepolia ETH for deployment and transactions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blockchain-based-research-and-academic-log
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root folder:

```env
INFURA_SEPOLIA_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_wallet_private_key
```

Create a `.env` file in the `backend` folder:

```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
PORT=5000
```

Important: never commit `.env` files to GitHub.

### 4. Compile Smart Contracts

```bash
npx hardhat compile
```

### 5. Deploy Smart Contract

```bash
node scripts/deploy.js
```

After deployment, copy the deployed contract address into:

```text
frontend/src/config.js
```

### 6. Run Backend

```bash
cd backend
npm install
npm start
```

The backend runs on:

```text
http://localhost:5000
```

### 7. Run Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend runs on:

```text
http://localhost:3000
```

## Testing

### Smart Contract Tests

Run from the project root:

```bash
npx hardhat test
```

The contract tests check:

- Research creation.
- Version creation.
- Duplicate version prevention.
- Author-only version addition.
- Research ID retrieval.
- Owner research counting.

### Frontend Tests

Run from the frontend folder:

```bash
npm test
```

## Project Folder Structure

```text
blockchain-based-research-and-academic-log/
  backend/
    index.js
    package.json
  contracts/
    ResearchLog.sol
    Lock.sol
  frontend/
    public/
    src/
      Designcomponents/
      contracts/
      hooks/
      services/
      utils/
      App.js
      config.js
  scripts/
    deploy.js
  test/
    ResearchLog.js
    Lock.js
  hardhat.config.js
  package.json
  README.md
```

## Defense Highlights

This project demonstrates the following BIT-level concepts:

- Full-stack application development.
- Smart contract design using Solidity.
- Ethereum testnet deployment.
- Blockchain-based timestamping and ownership proof.
- IPFS decentralized storage.
- Secure API handling through backend environment variables.
- Frontend wallet integration using MetaMask.
- Client-side encryption and hashing.
- Access control using smart contract mappings.
- React component-based UI development.
- Testing of smart contract behavior.

## Limitations

- The system depends on MetaMask or a compatible injected wallet.
- IPFS files are retrievable as long as they remain pinned through Pinata or another pinning service.
- Blockchain transactions require gas fees on the selected network.
- Private file access depends on the wallet-derived encryption key.
- The project currently uses Sepolia testnet for demonstration rather than Ethereum mainnet.

## Future Enhancements

- Add a dedicated `getOwnerResearchNumber()` smart contract getter.
- Improve frontend automated tests for the current interface.
- Add role-based institution verification.
- Add search, filtering, and sorting for research records.
- Add DOI-like permanent research identifiers.
- Add downloadable audit reports for uploaded research.
- Add better mobile responsiveness and accessibility improvements.
- Add event-based indexing for faster research loading.
- Add support for multiple file attachments under one research entry.

## Conclusion

Blockchain-Based Research and Academic Log is a practical decentralized academic record system. It shows how blockchain can be used for proof of ownership, timestamps, version history, and access control, while IPFS handles decentralized file storage. The project combines Solidity, React, Express, IPFS, Pinata, MetaMask, and cryptographic techniques to create a secure and verifiable research logging platform suitable for academic use.
