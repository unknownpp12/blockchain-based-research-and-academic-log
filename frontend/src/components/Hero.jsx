export default function Hero({ account, connectWallet, loadResearches, setShowForm, researches }) {
  const shortAccount = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "Not connected";

  return (
    <section className="grid md:grid-cols-2 gap-8 mt-10">
      
      {/* LEFT */}
      <div className="card p-8 min-h-[220px]">
        <h2 className="text-4xl font-bold">
          Decentralized Research Logs
        </h2>

        <p className="text-gray-400 mt-4">
          Store and access research securely on blockchain.
        </p>

        <div className="flex gap-3 mt-6">
          <button onClick={connectWallet} className="btn-primary">
            Connect
          </button>

          <button onClick={loadResearches} className="btn-secondary">
            Load
          </button>

          <button onClick={() => setShowForm(true)} className="btn-secondary">
            Add
          </button>
        </div>

        <div className="mt-6 text-gray-400">
          <p>Research count: {researches.length}</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="p-8 w-full max-w-[400px] min-h-[180px] rounded-lg bg-gradient-to-br from-purple-600 via-blue-500 to-pink-500 text-white shadow-lg">
        
        <p className="text-xl font-semibold mb-2">
          Ethereum
        </p>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center">
            <img
              src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
              alt="eth"
              className="w-5 h-5 invert"
            />
          </div>
        </div>
        <p className="text-white-400 text-sm">Connected Account</p>
        <p className="text-white text-sm mb-3">
          {shortAccount}
        </p>

        <p className="text-white/70 text-sm">
          Use MetaMask to upload and access encrypted research.
        </p>
      </div>
    </section>
  );
}