import { useRef, useState } from "react";
export default function ResearchModal({
  showForm,
  setShowForm,
  createResearch,
  handleFileChange,
  setTitle,
  setAuthor,
  setDescription,
  setTags,
  setCoAuthor,
  setInstitution,
  setCategory,
  isPublic,
  setIsPublic,
  txLoading,
  file,
  title,
  author,
  description,
  tags,
  institution,
  category,
  resetResearchForm,
}) {
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const onFileChange = (e) => {
    handleFileChange(e); // keep existing logic
    const file = e.target.files[0];
    setFileName(file ? file.name : "");
  };
  
  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const success = await createResearch();

      if (success) {
        setFileName("");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        resetLocalForm();
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetLocalForm = () => {
    setFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    resetResearchForm();
  };

  if (!showForm) return null;
  const isSubmitting = submitting || txLoading;

  const hasEmptyRequiredField =
  !title.trim() ||
  !author.trim() ||
  !description.trim() ||
  !tags.trim() ||
  !institution.trim() ||
  !category.trim() ||
  !file;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="card p-6 w-[400px]">
        <div className="w-[420px] relative rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-6 shadow-xl">

          <h2 className="text-xl font-semibold text-white mb-4">
            Add Research
          </h2>

  {/* INPUTS */}
  <div className="space-y-2">

    <input
      placeholder="Title"
      onChange={(e) => setTitle(e.target.value)}
      className="w-full px-3 py-1.5 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <input
      placeholder="Author"
      onChange={(e) => setAuthor(e.target.value)}
      className="w-full px-3 py-1.5 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <textarea
      placeholder="Description"
      rows={1}
      onChange={(e) => setDescription(e.target.value)}
      className="w-full px-3 py-1.5 rounded-lg bg-white text-black placeholder-gray-500 outline-none resize-none"
    />

    <input
      placeholder="Tags"
      onChange={(e) => setTags(e.target.value)}
      className="w-full px-3 py-1.5 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <input
      placeholder="Co-author"
      onChange={(e) => setCoAuthor(e.target.value)}
      className="w-full px-3 py-1.5 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <input
      placeholder="Institution"
      onChange={(e) => setInstitution(e.target.value)}
      className="w-full px-3 py-1.5 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
    />

    <input
      placeholder="Category"
      onChange={(e) => setCategory(e.target.value)}
      className="w-full px-3 py-1.5 rounded-lg bg-white text-black placeholder-gray-500 outline-none"
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
      <label className="inline-block px-4 py-1.5 bg-white text-black rounded-lg cursor-pointer text-sm">
        Choose File
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx,.xml,.odt,.rtf,.md,.xlsx,.csv,.pptx,.html,.htm,.doc,.wps,.hwp,.epub,
            application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,
            application/xml,text/xml,application/vnd.oasis.opendocument.text,application/rtf,text/markdown,
            application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,
            application/vnd.openxmlformats-officedocument.presentationml.presentation,text/html,
            application/msword"
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
    {isSubmitting && (
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/80 text-white">
        Uploading research...
      </div>
    )}

    <button
      onClick={handleSubmit}
      disabled={isSubmitting || hasEmptyRequiredField}
      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? "Submitting..." : "Submit"}
    </button>

    <button
      onClick={() => {resetLocalForm(); setShowForm(false);}}
      disabled={isSubmitting}
      className="flex-1 border border-white/20 text-white py-1.5 rounded-lg"
    >
      Close
    </button>

  </div>

</div>
      </div>
    </div>
  );
}