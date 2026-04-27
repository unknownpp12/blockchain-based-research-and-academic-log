import { useState } from "react";
import './App.css';
import './index.css';

import { useWallet } from "./hooks/useWallet";
import { useNotification } from "./hooks/useNotification";
import { useResearch } from "./hooks/useResearch";
import { generateCitation } from "./utils/helpers";

import Navbar from "./Designcomponents/Navbar";
import Hero from "./Designcomponents/Hero";
import ResearchList from "./Designcomponents/ResearchList";
import ResearchModal from "./Designcomponents/ResearchModal";

function App() {
  const [showForm, setShowForm] = useState(false);
  const [shareAddress, setShareAddress] = useState("");
  const [citationFormat, setCitationFormat] = useState("APA");

  const { setMessage, setError } = useNotification();
  const { account, contract, encryptionKey, connectWallet } = useWallet();

  const {
    researches,
    setTitle,
    setDescription,
    setTags,
    setCoAuthor,
    setInstitution,
    setCategory,
    isPublic, setIsPublic,
    txLoading,
    loadingResearches,
    handleFileChange,
    createResearch,
    openFile,
    loadResearches,
    grantAccess,
    toggleVisibility,
  } = useResearch({ contract, account, encryptionKey, setMessage, setError });

  // Wrap createResearch to also close the modal on success
  async function handleCreateResearch() {
    const success = await createResearch();
    if (success) setShowForm(false);
  }

  return (
    <div className="relative min-h-screen bg-[#050816] text-white p-6 overflow-hidden">
      <div
        className="absolute top-[-150px] right-[-150px] w-[700px] h-[700px]
          bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500
          opacity-40 blur-[140px] pointer-events-none"
      />

      <Navbar
        account={account}
        connectWallet={connectWallet}
        loadResearches={loadResearches}
        setShowForm={setShowForm}
      />

      <Hero
        account={account}
        connectWallet={connectWallet}
        loadResearches={loadResearches}
        setShowForm={setShowForm}
        researches={researches}
      />

      <ResearchList
        researches={researches}
        account={account}
        grantAccess={grantAccess}
        toggleVisibility={toggleVisibility}
        openFile={openFile}
        generateCitation={generateCitation}
        citationFormat={citationFormat}
        setCitationFormat={setCitationFormat}
        setShareAddress={setShareAddress}
        txLoading={txLoading}
        loadingResearches={loadingResearches}
        shareAddress={shareAddress}
      />

      <ResearchModal
        showForm={showForm}
        setShowForm={setShowForm}
        createResearch={handleCreateResearch}
        handleFileChange={handleFileChange}
        setTitle={setTitle}
        setDescription={setDescription}
        setTags={setTags}
        setCoAuthor={setCoAuthor}
        setInstitution={setInstitution}
        setCategory={setCategory}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
      />

      <div className="relative z-10" />
    </div>
  );
}

export default App;
