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
  const [shareAddresses, setShareAddresses] = useState({});
  const [citationFormat, setCitationFormat] = useState("APA");

  const { message, setMessage, error, setError } = useNotification();
  const { account, contract, encryptionKey, connectWallet } = useWallet();

  const {
    researches,
    setTitle,
    setAuthor,
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
  } = useResearch({ contract, account, encryptionKey, setMessage, setError});

  // Wrap createResearch to also close the modal on success
  async function handleCreateResearch() {
    const success = await createResearch();
    if (success) setShowForm(false);
    return success;
  }

  return (
    <div className="relative min-h-screen bg-[#050816] text-white p-6 overflow-hidden">
      <div
        className="fixed top-[-150px] right-[-150px] w-[700px] h-[700px]
          bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500
          opacity-40 blur-[140px] pointer-events-none z-0"
      />
      {(message || error) && (
        <div className="relative z-20 mt-6 md:ml-8">
          {message && <p className="text-green-300">{message}</p>}
          {error && <p className="text-red-300">{error}</p>}
        </div>
      )}

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
        setShareAddresses={setShareAddresses}
        txLoading={txLoading}
        loadingResearches={loadingResearches}
        shareAddresses={shareAddresses}
        setMessage={setMessage}
        setError={setError}
      />

      <ResearchModal
        showForm={showForm}
        setShowForm={setShowForm}
        createResearch={handleCreateResearch}
        handleFileChange={handleFileChange}
        setTitle={setTitle}
        setAuthor={setAuthor}
        setDescription={setDescription}
        setTags={setTags}
        setCoAuthor={setCoAuthor}
        setInstitution={setInstitution}
        setCategory={setCategory}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
        txLoading={txLoading}
      />

      <div className="relative z-10" />
    </div>
  );
}

export default App;
