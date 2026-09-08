import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ImagePlus, X } from "lucide-react";
import type { CommonProps } from "../../types";
import { validateBook, writerRepository } from "../../features/writer";
import {
  apiWriterRepository,
  useApiWriterContent,
} from "../../services/repositories/writerRepository";

type CatalogItem = {
  id: string;
  name: string;
};

const MAX_COVER_BYTES = 10 * 1024 * 1024;

const ACCEPTED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function WriterCreate({ navigate }: CommonProps) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");

  const [genres, setGenres] = useState<CatalogItem[]>([]);
  const [genre, setGenre] = useState("");

  const [availableTags, setAvailableTags] = useState<CatalogItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSelect, setTagSelect] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  /*
   * Load authoritative genre and tag catalogs.
   */
  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const [genresResponse, tagsResponse] = await Promise.all([
          fetch("/api/v1/genres"),
          fetch("/api/v1/tags"),
        ]);

        if (!genresResponse.ok) {
          throw new Error("Failed to load genres.");
        }

        if (!tagsResponse.ok) {
          throw new Error("Failed to load tags.");
        }

        const genresData = (await genresResponse.json()) as {
          genres?: CatalogItem[];
        };

        const tagsData = (await tagsResponse.json()) as {
          tags?: CatalogItem[];
        };

        if (cancelled) return;

        const loadedGenres = Array.isArray(genresData.genres)
          ? genresData.genres
          : [];

        const loadedTags = Array.isArray(tagsData.tags) ? tagsData.tags : [];

        setGenres(loadedGenres);
        setAvailableTags(loadedTags);

        if (loadedGenres.length > 0) {
          setGenre(loadedGenres[0].id);
        }
      } catch (error) {
        console.error("Failed to load writer catalog:", error);

        if (!cancelled) {
          setErrors([
            error instanceof Error
              ? error.message
              : "Unable to load genres and tags.",
          ]);
        }
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCoverChange = (file: File | null) => {
    if (!file) return;

    const nextErrors: string[] = [];

    if (!ACCEPTED_COVER_TYPES.has(file.type)) {
      nextErrors.push("Cover must be a JPEG, PNG, or WebP image.");
    }

    if (file.size > MAX_COVER_BYTES) {
      nextErrors.push("Cover image must not exceed 10 MB.");
    }

    if (nextErrors.length > 0) {
      setCoverFile(null);
      setCoverPreview("");
      setErrors(nextErrors);
      return;
    }

    if (coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrors([]);
  };

  const removeCover = () => {
    if (coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverFile(null);
    setCoverPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTagAdd = () => {
    if (!tagSelect) return;

    if (!selectedTags.includes(tagSelect)) {
      setSelectedTags((current) => [...current, tagSelect]);
    }

    setTagSelect("");
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags((current) => current.filter((id) => id !== tagId));
  };

  const handleCreate = async () => {
    if (submitting) return;

    const validation = validateBook({
      title,
      synopsis,
      genres: genre ? [genre] : [],
      cover: coverPreview || "",
      status: "DRAFT",
    });

    const nextErrors = [...validation.errors.map((error) => error.message)];

    /*
     * API mode requires an actual uploaded cover.
     */
    if (useApiWriterContent && !coverFile) {
      nextErrors.push("A cover image is required.");
    }

    /*
     * API mode requires an actual database Genre UUID.
     */
    if (useApiWriterContent && !genre) {
      nextErrors.push("Please select a genre.");
    }

    /*
     * Defensive validation: every selected tag must be
     * an ID from the authoritative catalog loaded above.
     */
    if (useApiWriterContent) {
      const validTagIds = new Set(availableTags.map((tag) => tag.id));

      const invalidTagIds = selectedTags.filter(
        (tagId) => !validTagIds.has(tagId),
      );

      if (invalidTagIds.length > 0) {
        nextErrors.push(
          "One or more selected tags are invalid. Please select the tags again.",
        );
      }
    }

    if (nextErrors.length > 0) {
      setErrors([...new Set(nextErrors)]);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    try {
      const createdBook = useApiWriterContent
        ? await apiWriterRepository.createBook({
            title: title.trim(),
            synopsis: synopsis.trim(),
            genres: [genre],
            tags: selectedTags,
          })
        : writerRepository.createBook({
            writerId: "writer-1",
            title: title.trim(),
            subtitle: "",
            penName: "Kemi N. Osei",
            synopsis: synopsis.trim(),
            genres: [genre],
            tags: selectedTags,
            status: "DRAFT",
            cover: coverPreview,
            heroImage: coverPreview,
            freeChapters: 1,
            chapterPricing: 80,
            isStandalone: true,
            audience: "general",
            contentWarnings: [],
            publishingStrategy: "serial",
            chapters: [],
          });

      if (useApiWriterContent) {
        if (!coverFile) {
          throw new Error("Cover image is required.");
        }

        await apiWriterRepository.uploadBookCover(createdBook.id, coverFile, {
          altText: `${title.trim()} cover`,
        });
      }

      const newChapter = useApiWriterContent
        ? await apiWriterRepository.createChapter(createdBook.id, {
            title: "Chapter 1",
            content: "Begin your chapter here.",
            number: 1,
            accessType: "FREE",
          })
        : writerRepository.createChapter(createdBook.id, {
            title: "Chapter 1",
            content: "",
            status: "DRAFT",
            accessType: "FREE",
          });

      navigate("writer-editor", createdBook.id, newChapter.id);
    } catch (caught) {
      setErrors([
        caught instanceof Error ? caught.message : "Unable to create book.",
      ]);

      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col min-h-full"
      style={{
        background: "var(--color-background)",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-10 pb-4 sticky top-0 z-10"
        style={{
          background: "var(--color-background)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("writer-books")}
          className="p-1.5"
          aria-label="Back to books"
        >
          <ArrowLeft size={20} color="var(--color-accent-primary)" />
        </button>

        <h1
          className="font-display text-lg font-bold flex-1"
          style={{
            color: "var(--color-text-primary)",
          }}
        >
          New Book
        </h1>

        <button
          type="button"
          disabled={submitting}
          className="px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
          style={{
            background: "var(--color-accent-primary)",
            color: "var(--color-background)",
          }}
          onClick={handleCreate}
        >
          {submitting ? "Creating..." : "Create"}
        </button>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">
        <div
          className="relative w-full h-64 rounded-2xl overflow-hidden flex flex-col items-center justify-center"
          style={{
            background: "#1e2118",
            border: "2px dashed #2a3525",
          }}
        >
          {coverPreview ? (
            <>
              <img
                src={coverPreview}
                alt="Selected book cover preview"
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black/50" />

              <button
                type="button"
                onClick={removeCover}
                className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/60"
                aria-label="Remove cover"
              >
                <X size={16} color="#fff" />
              </button>

              <div className="relative z-10 flex flex-col items-center gap-3">
                <p className="text-sm font-semibold text-white">
                  {coverFile?.name}
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-bold active:scale-95"
                  style={{
                    background: "#2a3525",
                    color: "#4ade80",
                  }}
                >
                  Change Image
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "#2a3525",
                }}
              >
                <ImagePlus size={24} color="var(--color-accent-primary)" />
              </div>

              <div className="text-center mt-3">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: "#f0ece4",
                  }}
                >
                  Upload cover art
                </p>

                <p
                  className="text-xs mt-0.5"
                  style={{
                    color: "#6a8060",
                  }}
                >
                  JPEG, PNG or WebP · max 10 MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold active:scale-95"
                style={{
                  background: "#2a3525",
                  color: "#4ade80",
                }}
              >
                Choose Image
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              handleCoverChange(event.target.files?.[0] ?? null);
            }}
          />
        </div>

        <div>
          <label
            className="text-xs font-bold uppercase tracking-wider mb-2 block"
            style={{
              color: "#4a6540",
            }}
          >
            Title
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="The name of your book…"
            maxLength={160}
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
            style={{
              color: "#4a6540",
            }}
          >
            Genre
          </label>

          <div className="relative">
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              disabled={genres.length === 0}
              className="w-full px-4 py-3 rounded-xl outline-none text-sm appearance-none"
              style={{
                background: "#1e2118",
                color: "#f0ece4",
                border: "1px solid #2a3525",
              }}
            >
              {genres.length === 0 ? (
                <option value="">Loading genres...</option>
              ) : (
                genres.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              )}
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
            style={{
              color: "#4a6540",
            }}
          >
            Tags
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={tagSelect}
                onChange={(event) => setTagSelect(event.target.value)}
                disabled={availableTags.length === 0}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm appearance-none"
                style={{
                  background: "#1e2118",
                  color: "#f0ece4",
                  border: "1px solid #2a3525",
                }}
              >
                <option value="">
                  {availableTags.length === 0
                    ? "Loading tags..."
                    : "Select a tag..."}
                </option>

                {availableTags
                  .filter((item) => !selectedTags.includes(item.id))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>

              <ChevronDown
                size={14}
                color="#4a6540"
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>

            <button
              type="button"
              onClick={handleTagAdd}
              disabled={!tagSelect}
              className="px-4 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{
                background: "#2a3525",
                color: "#4ade80",
              }}
            >
              Add
            </button>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedTags.map((tagId) => {
                const tag = availableTags.find((item) => item.id === tagId);

                if (!tag) return null;

                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagRemove(tag.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: "#2a3525",
                      color: "#f0ece4",
                    }}
                    aria-label={`Remove ${tag.name}`}
                  >
                    {tag.name}
                    <X size={12} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label
            className="text-xs font-bold uppercase tracking-wider mb-2 block"
            style={{
              color: "#4a6540",
            }}
          >
            Synopsis
          </label>

          <textarea
            value={synopsis}
            onChange={(event) => setSynopsis(event.target.value)}
            placeholder="What is your story about? Hook your readers…"
            rows={4}
            maxLength={600}
            className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
            style={{
              background: "#1e2118",
              color: "#f0ece4",
              border: "1px solid #2a3525",
            }}
          />

          <p
            className="text-[10px] mt-1"
            style={{
              color: "#4a6540",
            }}
          >
            {synopsis.length}/600 characters
          </p>
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting}
          className="w-full h-14 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform mt-2 disabled:opacity-50"
          style={{
            background: "#4ade80",
            color: "#0d1208",
          }}
        >
          {submitting ? "Creating book..." : "Create Book & Start Writing"}
        </button>
      </div>
    </div>
  );
}
