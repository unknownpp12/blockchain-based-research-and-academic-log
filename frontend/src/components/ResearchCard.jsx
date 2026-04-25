import { useState } from "react";

export default function ResearchCard({
  v,
  index,
  researchId,
  account,
  grantAccess,
  toggleVisibility,
  openFile,
  generateCitation,
  citationFormat,
  setCitationFormat,
  setShareAddress,
  txLoading,
  shareAddress,
  loadingResearches
}) {
  const [open, setOpen] = useState(false);

  const canViewDetails = v.isPublic || v.hasAccess;

  return (
    <div
      className={`w-full`}
    >
      <div className="card py-5 px-0 flex flex-col">

        {/* HEADER (aligned row) */}
        <div className="flex justify-between items-start gap-4">

          {/* LEFT */}
          <div>
            <p className="text-xs text-gray-400">
              Version {index + 1}
            </p>

            <h3 className="text-lg font-semibold">
              {v.title}
            </h3>

            <p className="text-sm text-gray-500">
              Original uploader: {v.firstUploader || "N/A"}
            </p>
          </div>

          {/* RIGHT (status + toggle) */}
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              v.isPublic
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
              {v.isPublic ? "Public" : "Private"}
            </span>
            <button
              onClick={() => setOpen(!open)}
              className="text-blue-400 text-xs"
            >
              {open ? "Hide ▲" : "Details ▼"}
            </button>

          </div>
        </div>
      {/* COLLAPSE */}
      {open && (
        <div className="mt-4 border-t border-white/10 pt-4">

          {!canViewDetails ? (
            <p className="text-gray-500">
              🔒 Private research (restricted)
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">

              {/* LEFT DETAILS */}
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-400">Original:</span> {v.firstUploader}</p>
                <p><span className="text-gray-400">Uploaded By:</span> {v.uploader}</p>
                <p><span className="text-gray-400">Type:</span> {v.fileType}</p>
              </div>

              {/* RIGHT DETAILS */}
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-400">Hash:</span> {v.fileHash}</p>
                <p><span className="text-gray-400">Description:</span> {v.description}</p>
                <p><span className="text-gray-400">Timestamp:</span> {v.timestamp}</p>
              </div>

              {/* ACTIONS FULL WIDTH */}
              {v.hasAccess && (
                <div className="col-span-full mt-3 border-t border-white/10 pt-3">

                  <input
                    placeholder="Share address"
                    value={shareAddress}
                    onChange={(e) => setShareAddress(e.target.value)}
                    className="input mb-2 text-black border-gray-700 placeholder-gray-400"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => grantAccess(v.fileHash)}
                      className="btn-secondary"
                      disabled={txLoading}
                    >
                      {txLoading ? "Processing..." : "Share"}
                    </button>

                    <button
                      onClick={() => toggleVisibility(v)}
                      className="btn-secondary"
                      disabled={txLoading}
                    >
                      {txLoading?"Processing...": v.isPublic? "Make Private": "Make Public"}
                    </button>

                    <button
                      onClick={() =>
                        openFile(
                          v.isPublic ? v.publicCID : v.fileCID,
                          v.fileType,
                          v.fileHash,
                          v.isPublic
                        )
                      }
                      className="btn-secondary"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => {
                        const citation = generateCitation(v, citationFormat);
                        navigator.clipboard.writeText(citation);
                      }}
                      className="btn-secondary"
                      disabled={txLoading}
                    >
                      {txLoading ? "Processing..." : "Copy citation"}
                    </button>
                  </div>

                  <select
                    value={citationFormat}
                    onChange={(e) => setCitationFormat(e.target.value)}
                    className="input mt-2 text-black border-gray-700 placeholder-gray-400"
                  >
                    <option value="APA">APA</option>
                    <option value="MLA">MLA</option>
                    <option value="IEEE">IEEE</option>
                  </select>

                  <p className="text-xs text-gray-400 mt-2">
                    {generateCitation(v, citationFormat)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

    </div>
  );
}