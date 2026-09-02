import { useState } from "react";
import { ArrowLeft, ChevronDown, ImagePlus } from "lucide-react";
import type { CommonProps } from "../../types";
import { validateBook, writerRepository } from "../../features/writer";

const genres = [
  "Fantasy",
  "Thriller",
  "Family Saga",
  "Children's Story",
  "Adventure",
  "Romance",
  "Cultural Fiction",
  "Mystery",
];

export default function WriterCreate({ navigate }: CommonProps) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("Fantasy");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = () => {
    if (submitting) return;
    setSubmitting(true);
    const validation = validateBook({
      title,
      synopsis,
      genres: genre ? [genre] : [],
      cover:
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80",
      status: "DRAFT",
    });

    if (!validation.isValid) {
      setErrors(validation.errors.map((error) => error.message));
      setSubmitting(false);
      return;
    }

    const createdBook = writerRepository.createBook({
      writerId: "writer-1",
      title,
      subtitle: "",
      penName: "Kemi N. Osei",
      synopsis,
      genres: [genre],
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: "DRAFT",
      cover:
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80",
      heroImage:
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80",
      freeChapters: 1,
      chapterPricing: 80,
      isStandalone: true,
      audience: "general",
      contentWarnings: [],
      publishingStrategy: "serial",
      chapters: [],
    });

    const newChapter = writerRepository.createChapter(createdBook.id, {
      title: `Chapter 1`,
      content: "",
      status: "DRAFT",
      accessType: "FREE",
    });

    setErrors([]);
    navigate("writer-editor", createdBook.id, newChapter.id);
  };

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "var(--color-background)" }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-10 pb-4 sticky top-0 z-10"
        style={{
          background: "var(--color-background)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <button onClick={() => navigate("writer-books")} className="p-1.5">
          <ArrowLeft size={20} color="var(--color-accent-primary)" />
        </button>
        <h1
          className="font-display text-lg font-bold flex-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          New Book
        </h1>
        <button
          className="px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          style={{
            background: "var(--color-accent-primary)",
            color: "var(--color-background)",
          }}
          onClick={handleCreate}
        >
          Create
        </button>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">
        <div
          className="w-full h-48 rounded-2xl flex flex-col items-center justify-center gap-3"
          style={{ background: "#1e2118", border: "2px dashed #2a3525" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "#2a3525" }}
          >
            <ImagePlus size={24} color="var(--color-accent-primary)" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>
              Upload cover art
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6a8060" }}>
              Mock media boundary ready for later storage
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-xs font-bold active:scale-95"
            style={{ background: "#2a3525", color: "#4ade80" }}
          >
            Choose Image
          </button>
        </div>

        <div>
          <label
            className="text-xs font-bold uppercase tracking-wider mb-2 block"
            style={{ color: "#4a6540" }}
          >
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The name of your book…"
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{
              background: "#1e2118",
              color: "#f0ece4",
              border: "1px solid #2a3525",
            }}
          />
        </div>

        <div>
          <label
            className="text-xs font-bold uppercase tracking-wider mb-2 block"
            style={{ color: "#4a6540" }}
          >
            Genre
          </label>
          <div className="relative">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none text-sm appearance-none"
              style={{
                background: "#1e2118",
                color: "#f0ece4",
                border: "1px solid #2a3525",
              }}
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              color="#4a6540"
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label
            className="text-xs font-bold uppercase tracking-wider mb-2 block"
            style={{ color: "#4a6540" }}
          >
            Synopsis
          </label>
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="What is your story about? Hook your readers…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
            style={{
              background: "#1e2118",
              color: "#f0ece4",
              border: "1px solid #2a3525",
            }}
          />
          <p className="text-[10px] mt-1" style={{ color: "#4a6540" }}>
            {synopsis.length}/600 characters
          </p>
        </div>

        <div>
          <label
            className="text-xs font-bold uppercase tracking-wider mb-2 block"
            style={{ color: "#4a6540" }}
          >
            Tags
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. Africa, magic, coming-of-age"
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{
              background: "#1e2118",
              color: "#f0ece4",
              border: "1px solid #2a3525",
            }}
          />
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={submitting}
          className="w-full h-14 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform mt-2"
          style={{ background: "#4ade80", color: "#0d1208" }}
        >
          {submitting ? "Creating book..." : "Create Book & Start Writing"}
        </button>
      </div>
    </div>
  );
}
