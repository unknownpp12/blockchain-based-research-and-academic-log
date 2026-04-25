export default function Hero({ account, connectWallet, loadResearches, setShowForm, researches }) {
  const shortAccount = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "Not connected";

  return (
    <section className="grid md:grid-cols-2 gap-8 mt-10">
      
      {/* LEFT */}
      <div className="card p-8">
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
      <div className="card p-6">
        <p className="text-gray-400 text-sm">Connected Account</p>
        <p className="mb-4">{shortAccount }</p>

        <p className="text-gray-500 text-sm">
          Use MetaMask to upload and access encrypted research.
        </p>
      </div>
    </section>
  );
}