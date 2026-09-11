import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ImagePlus, PenLine, X } from "lucide-react";
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
   * Load the authoritative backend genre and tag catalogs.
   *
   * The IDs returned here are sent to the API. Do not replace
   * them with display names.
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

        if (cancelled) {
          return;
        }

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

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCoverChange = (file: File | null) => {
    if (!file) {
      return;
    }

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
    if (!tagSelect) {
      return;
    }

    if (!selectedTags.includes(tagSelect)) {
      setSelectedTags((current) => [...current, tagSelect]);
    }

    setTagSelect("");
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags((current) => current.filter((id) => id !== tagId));
  };

  const handleCreate = async () => {
    if (submitting) {
      return;
    }

    const validation = validateBook({
      title,
      synopsis,
      genres: genre ? [genre] : [],
      cover: coverPreview || "",
      status: "DRAFT",
    });

    const nextErrors = validation.errors.map((error) => error.message);

    if (useApiWriterContent && !coverFile) {
      nextErrors.push("A cover image is required.");
    }

    if (useApiWriterContent && !genre) {
      nextErrors.push("Please select a genre.");
    }

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

      /*
       * API mode:
       * the book is created first, then the cover is uploaded
       * through the authenticated binary upload endpoint.
       */
      if (useApiWriterContent) {
        if (!coverFile) {
          throw new Error("Cover image is required.");
        }

        await apiWriterRepository.uploadBookCover(createdBook.id, coverFile, {
          altText: `${title.trim()} cover`,
        });
      }

      /*
       * Every newly created book gets Chapter 1 so the writer
       * can immediately enter the editor.
       */
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
    <div className="somi-create-page">
      <div className="somi-create-inner">
        <header className="somi-create-header">
          <div className="somi-create-header-main">
            <button
              type="button"
              onClick={() => navigate("writer-books")}
              className="somi-create-back"
              aria-label="Back to books"
            >
              <ArrowLeft size={17} />
              <span>Back to books</span>
            </button>

            <p className="somi-create-eyebrow">Writer Studio</p>

            <h1 className="somi-create-title">Start a new story.</h1>

            <p className="somi-create-description">
              Set up the essentials for your book. You can refine the
              manuscript, metadata, and chapters in the editor.
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleCreate()}
            className="somi-create-submit somi-create-submit-header"
          >
            <PenLine size={14} />

            {submitting ? "Creating..." : "Create Book"}
          </button>
        </header>

        <form
          className="somi-create-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <div className="somi-create-grid">
            <aside className="somi-create-cover">
              <div className="somi-create-cover-frame">
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Selected book cover preview" />

                    <div className="somi-create-cover-overlay" />

                    <button
                      type="button"
                      onClick={removeCover}
                      className="somi-create-cover-remove"
                      aria-label="Remove cover"
                    >
                      <X size={15} />
                    </button>

                    <div className="somi-create-cover-selected">
                      <p>{coverFile?.name}</p>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="somi-create-cover-button"
                      >
                        Change image
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="somi-create-cover-placeholder">
                    <div className="somi-create-cover-icon">
                      <ImagePlus size={24} />
                    </div>

                    <strong className="somi-create-cover-title">
                      Cover art
                    </strong>

                    <p className="somi-create-cover-help">
                      JPEG, PNG or WebP
                      <br />
                      Maximum 10 MB
                    </p>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="somi-create-cover-button"
                    >
                      Choose image
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  handleCoverChange(event.target.files?.[0] ?? null);
                }}
              />
            </aside>

            <div className="somi-create-fields">
              <div className="somi-create-field">
                <label htmlFor="book-title" className="somi-create-label">
                  Title
                </label>

                <input
                  id="book-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="The name of your book…"
                  maxLength={160}
                  className="somi-create-input"
                />
              </div>

              <div className="somi-create-field">
                <label htmlFor="book-genre" className="somi-create-label">
                  Primary genre
                </label>

                <div className="somi-create-select-wrap">
                  <select
                    id="book-genre"
                    value={genre}
                    onChange={(event) => setGenre(event.target.value)}
                    disabled={genres.length === 0}
                    className="somi-create-select"
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

                  <ChevronDown size={14} />
                </div>

                <p className="somi-create-help">
                  Choose the primary genre that best describes the story.
                </p>
              </div>

              <div className="somi-create-field">
                <label htmlFor="book-tags" className="somi-create-label">
                  Tags
                </label>

                <div className="somi-create-tags">
                  <div className="somi-create-select-row">
                    <div className="somi-create-select-wrap">
                      <select
                        id="book-tags"
                        value={tagSelect}
                        onChange={(event) => setTagSelect(event.target.value)}
                        disabled={availableTags.length === 0}
                        className="somi-create-select"
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

                      <ChevronDown size={14} />
                    </div>

                    <button
                      type="button"
                      onClick={handleTagAdd}
                      disabled={!tagSelect}
                      className="somi-create-add-tag"
                    >
                      Add
                    </button>
                  </div>

                  {selectedTags.length > 0 && (
                    <div className="somi-create-tag-list">
                      {selectedTags.map((tagId) => {
                        const tag = availableTags.find(
                          (item) => item.id === tagId,
                        );

                        if (!tag) {
                          return null;
                        }

                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleTagRemove(tag.id)}
                            className="somi-create-tag"
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
              </div>

              <div className="somi-create-field">
                <label htmlFor="book-synopsis" className="somi-create-label">
                  Synopsis
                </label>

                <textarea
                  id="book-synopsis"
                  value={synopsis}
                  onChange={(event) => setSynopsis(event.target.value)}
                  placeholder="What is your story about? Hook your readers…"
                  rows={7}
                  maxLength={600}
                  className="somi-create-textarea"
                />

                <div className="somi-create-help somi-create-character-count">
                  {synopsis.length}/600 characters
                </div>
              </div>

              {errors.length > 0 && (
                <div className="somi-create-error">
                  <strong>Please fix the following:</strong>

                  {errors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <footer className="somi-create-footer">
            <button
              type="button"
              onClick={() => navigate("writer-books")}
              className="somi-create-cancel"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="somi-create-submit"
            >
              <PenLine size={14} />

              {submitting ? "Creating book..." : "Create Book & Start Writing"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
