import ResearchCard from "./ResearchCard";

export default function ResearchList(props) {
  const { researches } = props;

  if (props.loadingResearches) {
  return <p className="mt-10 text-gray-400 md:ml-8">Loading researches...</p>;
  }
  
  if (researches.length === 0) {
    return <p className="mt-10 text-gray-400 md:ml-8">No research loaded</p>;
  }

  const myResearches = researches.filter(
    (r) =>
      r.versions[0]?.uploader &&
      props.account &&
      r.versions[0].uploader.toLowerCase() === props.account.toLowerCase()
  );

  const otherResearches = researches.filter(
    (r) =>
      !props.account ||
      !r.versions[0]?.uploader ||
      r.versions[0].uploader.toLowerCase() !== props.account.toLowerCase()
  );

  return (
  <div className="mt-10 flex gap-8 ml-4 md:ml-8">

    {/* LEFT: YOUR FILES */}
    <div className="w-1/2 flex flex-col gap-6">
    <div className="inline-flex w-fit rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-1 text-sm text-blue-200">
      My files
    </div>
      {myResearches.map((r) => (
        <div key={r.id}>
          <h2 className="text-xl">Research {r.ownerResearchNumber || r.id}</h2>

          <div className="flex flex-col gap-4">
            {r.versions.map((v, i) => (
              <ResearchCard key={i}
               {...props} v={v} 
               index={i} researchId={r.id} 
               txLoading={props.txLoading}
               shareAddresses={props.shareAddresses}
               setShareAddresses={props.setShareAddresses} />
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* RIGHT: OTHERS */}
    <div className="w-1/2 flex flex-col gap-6">
    <div className="inline-flex w-fit rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-sm text-purple-200">
      Other's files
    </div>

      {otherResearches.map((r) => (
        <div key={r.id}>
          <h2 className="text-xl">Research {r.ownerResearchNumber || r.id}</h2>

          <div className="flex flex-col gap-4">
            {r.versions.map((v, i) => (
              <ResearchCard key={i} {...props} v={v} index={i} researchId={r.id} />
            ))}
          </div>
        </div>
      ))}
    </div>

  </div>
);
}
