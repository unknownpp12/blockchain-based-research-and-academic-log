export default function ResearchModal({
  showForm,
  setShowForm,
  createResearch,
  handleFileChange,
  setTitle,
  setDescription,
  setTags,
  setCoAuthor,
  setInstitution,
  setCategory,
  isPublic,
  setIsPublic
}) {
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="card p-6 w-[400px]">
        <h2 className="text-xl mb-4">Add Research</h2>

        <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} className="input mb-2" />
        <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} className="input mb-2" />
        <input placeholder="Tags" onChange={(e) => setTags(e.target.value)} className="input mb-2" />
        <input placeholder="Co-author" onChange={(e) => setCoAuthor(e.target.value)} className="input mb-2" />
        <input placeholder="Institution" onChange={(e) => setInstitution(e.target.value)} className="input mb-2" />
        <input placeholder="Category" onChange={(e) => setCategory(e.target.value)} className="input mb-2" />

        <label className="flex gap-2 my-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public
        </label>

        <input type="file" onChange={handleFileChange} />

        <div className="flex gap-2 mt-4">
          <button onClick={createResearch} className="btn-primary">
            Submit
          </button>

          <button onClick={() => setShowForm(false)} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}