export default function Navbar({ account, connectWallet, loadResearches, setShowForm }) {
    return (
        <header className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">BlockResearch</h1>
        </div>
      </header>
    );
   }

        // <div className="flex gap-3">
        //   <button className="btn-secondary">Home</button>

        //   <button onClick={loadResearches} className="btn-secondary">
        //     Load
        //   </button>

        //   <button onClick={() => setShowForm(true)} className="btn-secondary">
        //     Add
        //   </button>

        //   <button onClick={connectWallet} className="btn-primary">
        //     {account ? "Connected" : "Connect"}
        //   </button>
        // </div>