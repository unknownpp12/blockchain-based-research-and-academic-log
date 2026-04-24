import ResearchCard from "./ResearchCard";

export default function ResearchList(props) {
  const { researches } = props;

  if (researches.length === 0) {
    return <p className="mt-10 text-gray-400 md:ml-8">No research loaded</p>;
  }

  return (
    <div className="mt-10 grid gap-6 ml-4 md:ml-8">
      {researches.map((r) => (
        <div key={r.id}>
          <h2 className="text-xl ">Research {r.id}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {r.versions.map((v, i) => (
              <ResearchCard key={i} {...props} v={v} index={i} researchId= {r.id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}