import { useState } from "react";
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
  const [fileName, setFileName] = useState("");
  const onFileChange = (e) => {
  handleFileChange(e); // keep existing logic
  const file = e.target.files[0];
  if (file) setFileName(file.name);
};
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="card p-6 w-[400px]">
        <div className="w-[420px] rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-6 shadow-xl">

  <h2 className="text-xl font-semibold text-white mb-4">
    Add Research
  </h2>

  {/* INPUTS */}
  <div className="space-y-3">

    <input
      placeholder="Title"
      onChange={(e) => setTitle(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <textarea
      placeholder="Description"
      onChange={(e) => setDescription(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <input
      placeholder="Tags"
      onChange={(e) => setTags(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <input
      placeholder="Co-author"
      onChange={(e) => setCoAuthor(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <input
      placeholder="Institution"
      onChange={(e) => setInstitution(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <input
      placeholder="Category"
      onChange={(e) => setCategory(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    {/* PUBLIC TOGGLE */}
    <label className="flex items-center gap-2 text-sm text-white mt-2">
      <input
        type="checkbox"
        checked={isPublic}
        onChange={(e) => setIsPublic(e.target.checked)}
      />
      Public
    </label>

    {/* FILE UPLOAD */}
    <div className="mt-2">
      <label className="inline-block px-4 py-2 bg-white text-black rounded-lg cursor-pointer text-sm">
        Choose File
        <input
          type="file"
          onChange={onFileChange}
          className="hidden"
        />
      </label>
      <p className="text-sm text-gray-400 mt-2">
        {fileName || "No file selected"}
      </p>

      <p className="text-xs text-white/70 mt-2">
        Upload your research file
      </p>
    </div>

  </div>

  {/* BUTTONS */}
  <div className="flex gap-3 mt-6">

    <button
      onClick={createResearch}
      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-medium"
    >
      Submit
    </button>

    <button
      onClick={() => setShowForm(false)}
      className="flex-1 border border-white/20 text-white py-2 rounded-lg"
    >
      Close
    </button>

  </div>

</div>
      </div>
    </div>
  );
}