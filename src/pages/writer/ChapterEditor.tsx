import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bold, Clock, Eye, ImagePlus, Italic } from "lucide-react";
import { useLocation } from "react-router-dom";
import type { CommonProps } from "../../types";
import {
  countWords,
  createAutosaveState,
  estimateReadingTime,
  updateAutosaveState,
  validateChapter,
  writerRepository,
} from "../../features/writer";
import { ErrorState, StatusBadge } from "../../components/DesignPrimitives";
import { statusToneFor } from "../../config/designSystem";
import {
  apiWriterRepository,
  useApiWriterContent,
} from "../../services/repositories/writerRepository";
import { useAuth } from "../../app/auth";
import ChapterContent from "../../components/reader/ChapterContent";

export default function ChapterEditor({ navigate }: CommonProps) {
  const instanceIdRef = useRef(
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  const { pathname } = useLocation();

  const routeMatch = pathname.match(
    /^\/writer\/books\/([^/]+)\/chapters\/([^/]+)\/edit$/,
  );

  const bookId = routeMatch?.[1];
  const chapterId = routeMatch?.[2];

  const { isLoading: isAuthLoading } = useAuth();

  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<number | null>(null);

  /*
   * ============================================================
   * AUTOSAVE CONCURRENCY STATE
   * ============================================================
   *
   * Only one server save may exist at a time.
   *
   * If another save trigger occurs while a request is running,
   * it joins the existing promise instead of creating another
   * PATCH with the same/stale contentVersion.
   */
  const saveInFlight = useRef(false);
  const saveQueued = useRef(false);
  const savePromiseRef = useRef<Promise<void> | null>(null);

  /*
   * ============================================================
   * AUTHORITATIVE LOCAL EDITOR STATE
   * ============================================================
   */
  const titleRef = useRef("");
  const contentRef = useRef("");

  /*
   * The currently loaded chapter returned by the server.
   */
  const chapterRef = useRef<
    | Awaited<ReturnType<typeof apiWriterRepository.getChapter>>
    | ReturnType<typeof writerRepository.getChapter>
    | null
  >(null);

  /*
   * The server's authoritative optimistic-concurrency version.
   *
   * This is the ONLY version that may be sent as clientVersion.
   */
  const serverVersionRef = useRef<number | null>(null);

  /*
   * Incremented for every local title/content modification.
   *
   * Example:
   *
   * editSequence = 7
   * saveSequence = 7
   *
   * means the server save represents the current editor state.
   */
  const editSequenceRef = useRef(0);

  /*
   * The edit sequence that was most recently confirmed as persisted
   * successfully by the server.
   *
   * This is critical for manual Save:
   *
   * If editSequenceRef.current === lastPersistedEditSequenceRef.current
   * then there is nothing to save and the button must NOT issue another
   * PATCH request.
   */
  const lastPersistedEditSequenceRef = useRef<number | null>(null);

  /*
   * Protects the editor against an older asynchronous load applying
   * after a newer load has already started.
   */
  const loadGenerationRef = useRef(0);

  const [currentBook, setCurrentBook] = useState<
    | Awaited<ReturnType<typeof apiWriterRepository.getBook>>
    | ReturnType<typeof writerRepository.getBook>
  >();

  useEffect(() => {
    console.log(`[ChapterEditor ${instanceIdRef.current}] MOUNT`, {
      bookId,
      chapterId,
    });

    return () => {
      console.log(`[ChapterEditor ${instanceIdRef.current}] UNMOUNT`, {
        bookId,
        chapterId,
      });
    };
  }, [bookId, chapterId]);

  const startingChapter =
    currentBook && chapterId
      ? currentBook.chapters.find((entry) => entry.id === chapterId)
      : currentBook?.chapters[0];

  const [chapter, setChapter] = useState(startingChapter ?? null);
  const [title, setTitle] = useState(startingChapter?.title ?? "");
  const [content, setContent] = useState(startingChapter?.content ?? "");
  const [notes, setNotes] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [saveState, setSaveState] = useState(createAutosaveState());
  const [errors, setErrors] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);

  const recoveryKey =
    bookId && chapterId ? `somi-writer-draft:${bookId}:${chapterId}` : "";

  /*
   * ============================================================
   * LOAD CHAPTER
   * ============================================================
   *
   * Every load gets a generation number.
   *
   * An older asynchronous load is never allowed to overwrite the
   * state established by a newer load.
   */
  useEffect(() => {
    if (useApiWriterContent && isAuthLoading) return;

    const loadGeneration = ++loadGenerationRef.current;
    let cancelled = false;

    /*
     * A new load invalidates a pending debounce timer.
     *
     * We deliberately do NOT clear savePromiseRef here.
     * A load must never silently destroy the save lock.
     */
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const load = async () => {
      try {
        console.log(`[ChapterEditor ${instanceIdRef.current}] LOAD START`, {
          bookId,
          chapterId,
          loadGeneration,
        });

        const loadedBook = bookId
          ? useApiWriterContent
            ? await apiWriterRepository.getBook(bookId)
            : writerRepository.getBook(bookId)
          : undefined;

        if (cancelled || loadGeneration !== loadGenerationRef.current) {
          return;
        }

        setCurrentBook(loadedBook);

        const nextChapter =
          loadedBook && bookId && chapterId
            ? useApiWriterContent
              ? await apiWriterRepository.getChapter(bookId, chapterId)
              : writerRepository.getChapter(bookId, chapterId)
            : loadedBook?.chapters[0];

        if (cancelled || loadGeneration !== loadGenerationRef.current) {
          return;
        }

        const recovered = recoveryKey
          ? (JSON.parse(window.localStorage.getItem(recoveryKey) ?? "null") as {
              title?: string;
              content?: string;
              updatedAt?: string;
            } | null)
          : null;

        const useRecovery = Boolean(
          recovered?.updatedAt &&
          nextChapter?.updatedAt &&
          recovered.updatedAt > nextChapter.updatedAt,
        );

        const nextTitle = useRecovery
          ? (recovered?.title ?? "")
          : (nextChapter?.title ?? "");

        const nextContent = useRecovery
          ? (recovered?.content ?? "")
          : (nextChapter?.content ?? "");

        console.log(`[ChapterEditor ${instanceIdRef.current}] LOAD APPLY`, {
          loadGeneration,
          loadedVersion: nextChapter?.contentVersion ?? null,
          currentServerVersion: serverVersionRef.current,
          saveInFlight: saveInFlight.current,
          savePromiseExists: Boolean(savePromiseRef.current),
        });

        chapterRef.current = nextChapter ?? null;

        /*
         * Establish the authoritative server version.
         */
        serverVersionRef.current = nextChapter?.contentVersion ?? null;

        titleRef.current = nextTitle;
        contentRef.current = nextContent;

        editSequenceRef.current = 0;

        /*
         * The freshly loaded server state is clean.
         */
        lastPersistedEditSequenceRef.current = 0;

        /*
         * Do not reset savePromiseRef here.
         *
         * A load must never erase an active save lock.
         */
        saveQueued.current = false;

        setChapter(nextChapter ?? null);
        setTitle(nextTitle);
        setContent(nextContent);

        setSaveState(createAutosaveState());
        setErrors([]);
        setLoadError(null);

        console.log(
          `[ChapterEditor ${instanceIdRef.current}] VERSION INITIALIZED`,
          {
            loadGeneration,
            serverVersion: serverVersionRef.current,
          },
        );
      } catch (caught) {
        if (!cancelled && loadGeneration === loadGenerationRef.current) {
          setLoadError(
            caught instanceof Error
              ? caught.message
              : "Unable to load chapter.",
          );
        }
      }
    };

    void load();

    return () => {
      cancelled = true;

      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [bookId, chapterId, isAuthLoading, pathname, recoveryKey]);

  /*
   * ============================================================
   * UNMOUNT CLEANUP
   * ============================================================
   */
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, []);

  const wordCount = countWords(content);
  const readTime = estimateReadingTime(wordCount);

  /*
   * ============================================================
   * PERSIST CHAPTER
   * ============================================================
   *
   * Rules:
   *
   * 1. Never create two simultaneous API saves.
   * 2. Always use the authoritative serverVersionRef.
   * 3. Adopt the server's returned contentVersion after success.
   * 4. If edits occurred during a successful request, preserve them
   *    and schedule exactly one follow-up save.
   * 5. A 409 is NOT automatically retried.
   * 6. Manual Save does NOT send a redundant PATCH if the current
   *    editor state has already been successfully persisted.
   */
  const persistChapter = async (
    source: "autosave-timer" | "manual-save",
  ): Promise<void> => {
    console.log(`[ChapterEditor ${instanceIdRef.current}] persistChapter`, {
      source,
      savePromiseExists: Boolean(savePromiseRef.current),
      saveInFlight: saveInFlight.current,
      serverVersion: serverVersionRef.current,
      editSequence: editSequenceRef.current,
      lastPersistedEditSequence: lastPersistedEditSequenceRef.current,
    });

    if (!bookId) return;

    const currentChapter = chapterRef.current;

    if (!currentChapter) return;

    /*
     * ------------------------------------------------------------
     * Existing save
     * ------------------------------------------------------------
     *
     * Manual Save or another autosave joins the exact operation.
     */
    if (savePromiseRef.current) {
      saveQueued.current = true;

      console.log(
        `[ChapterEditor ${instanceIdRef.current}] JOIN EXISTING SAVE`,
        {
          source,
          serverVersion: serverVersionRef.current,
          editSequence: editSequenceRef.current,
        },
      );

      return savePromiseRef.current;
    }

    /*
     * ------------------------------------------------------------
     * Nothing dirty
     * ------------------------------------------------------------
     *
     * This is the critical fix for the Save draft button.
     *
     * If the latest editor state has already been confirmed by the
     * server, do NOT send another PATCH.
     */
    if (
      source === "manual-save" &&
      lastPersistedEditSequenceRef.current === editSequenceRef.current
    ) {
      console.log(
        `[ChapterEditor ${instanceIdRef.current}] MANUAL SAVE SKIPPED`,
        {
          reason: "current editor state already persisted",
          editSequence: editSequenceRef.current,
          lastPersistedEditSequence: lastPersistedEditSequenceRef.current,
          serverVersion: serverVersionRef.current,
        },
      );

      setSaveState((current) => updateAutosaveState(current, "SAVED"));

      return;
    }

    /*
     * Cancel any pending debounce because we are saving now.
     */
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const currentTitle = titleRef.current;
    const currentContent = textRef.current?.value ?? contentRef.current;

    const validation = validateChapter({
      title: currentTitle,
      content: currentContent,
      number: currentChapter.number,
      price: currentChapter.price,
      accessType: currentChapter.accessType,
    });

    if (!validation.isValid) {
      setErrors(validation.errors.map((error) => error.message));

      setSaveState((current) => updateAutosaveState(current, "ERROR"));

      return;
    }

    const requestVersion = serverVersionRef.current;

    console.log(`[ChapterEditor ${instanceIdRef.current}] SAVE VERSION`, {
      source,
      requestVersion,
      serverVersionRef: serverVersionRef.current,
      editSequence: editSequenceRef.current,
      lastPersistedEditSequence: lastPersistedEditSequenceRef.current,
    });

    /*
     * Server-backed chapters must always have an authoritative
     * concurrency version.
     */
    if (useApiWriterContent && requestVersion === null) {
      setErrors([
        "Unable to determine the chapter version. Please reload the chapter.",
      ]);

      setSaveState((current) => updateAutosaveState(current, "ERROR"));

      return;
    }

    const saveSequence = editSequenceRef.current;

    const nextChapter = {
      ...currentChapter,
      title: currentTitle.trim() || "Untitled chapter",
      content: currentContent,
      wordCount: countWords(currentContent),
      readingTime: estimateReadingTime(countWords(currentContent)),
      updatedAt: new Date().toISOString(),
      status: "EDITING" as const,
    };

    /*
     * ============================================================
     * LOCAL / MOCK MODE
     * ============================================================
     */
    if (!useApiWriterContent) {
      writerRepository.saveChapterDraft(bookId, nextChapter);

      if (currentBook) {
        const draft = currentBook.draft ?? {
          id: `draft-${bookId}`,
          bookId,
          writerId: currentBook.writerId,
          version: 1,
          title: currentBook.title,
          synopsis: currentBook.synopsis,
          genres: currentBook.genres,
          tags: currentBook.tags,
          cover: currentBook.cover,
          updatedAt: new Date().toISOString(),
          status: "EDITING",
        };

        writerRepository.updateBookDraft(bookId, {
          ...draft,
          title: currentTitle.trim() || currentBook.title,
          synopsis: currentBook.synopsis,
          genres: currentBook.genres,
          tags: currentBook.tags,
          cover: currentBook.cover,
          updatedAt: new Date().toISOString(),
          status: "EDITING",
        });
      }

      lastPersistedEditSequenceRef.current = saveSequence;

      setErrors([]);
      setChapter(nextChapter);
      chapterRef.current = nextChapter;

      setSaveState((current) => updateAutosaveState(current, "SAVED"));

      return;
    }

    /*
     * ============================================================
     * API MODE
     * ============================================================
     */

    saveInFlight.current = true;
    saveQueued.current = false;

    setSaveState((current) => updateAutosaveState(current, "SAVING"));

    /*
     * The promise is stored before any caller can create another
     * save operation.
     */
    const saveOperation = (async () => {
      let saveSucceeded = false;

      try {
        const requestChapter = {
          ...nextChapter,
          contentVersion: requestVersion as number,
        };

        console.log(
          `[ChapterEditor ${instanceIdRef.current}] API SAVE REQUEST`,
          {
            source,
            clientVersion: requestChapter.contentVersion,
            saveSequence,
            currentEditSequence: editSequenceRef.current,
          },
        );

        const savedChapter = await apiWriterRepository.autosaveChapter(
          bookId,
          requestChapter,
        );

        saveSucceeded = true;

        console.log(`[ChapterEditor ${instanceIdRef.current}] SAVE RESPONSE`, {
          source,
          requestVersion,
          responseVersion: savedChapter.contentVersion,
          editSequenceAtRequest: saveSequence,
          currentEditSequence: editSequenceRef.current,
        });

        /*
         * --------------------------------------------------------
         * SERVER VERSION
         * --------------------------------------------------------
         *
         * The response is authoritative.
         */
        serverVersionRef.current = savedChapter.contentVersion;

        console.log(
          `[ChapterEditor ${instanceIdRef.current}] VERSION REF UPDATED`,
          {
            source,
            serverVersion: serverVersionRef.current,
          },
        );

        const hasNewerLocalEdits = editSequenceRef.current !== saveSequence;

        if (hasNewerLocalEdits) {
          /*
           * The server now contains saveSequence, but the editor
           * contains newer local edits.
           *
           * Do NOT mark the current editor state as persisted.
           */
          chapterRef.current = {
            ...savedChapter,
            title: titleRef.current,
            content: contentRef.current,
            wordCount: countWords(contentRef.current),
            readingTime: estimateReadingTime(countWords(contentRef.current)),
          };

          saveQueued.current = true;

          setSaveState((current) => updateAutosaveState(current, "DIRTY"));

          console.log(
            `[ChapterEditor ${instanceIdRef.current}] NEWER LOCAL EDITS DETECTED`,
            {
              persistedSequence: saveSequence,
              currentEditSequence: editSequenceRef.current,
              serverVersion: serverVersionRef.current,
            },
          );
        } else {
          /*
           * The server response represents the current editor state.
           */
          chapterRef.current = savedChapter;

          titleRef.current = savedChapter.title;
          contentRef.current = savedChapter.content;

          setChapter(savedChapter);
          setTitle(savedChapter.title);
          setContent(savedChapter.content);

          /*
           * This is the critical state used by manual Save.
           */
          lastPersistedEditSequenceRef.current = saveSequence;

          if (recoveryKey) {
            window.localStorage.removeItem(recoveryKey);
          }

          setErrors([]);

          setSaveState((current) => updateAutosaveState(current, "SAVED"));

          console.log(
            `[ChapterEditor ${instanceIdRef.current}] EDITOR STATE PERSISTED`,
            {
              persistedEditSequence: lastPersistedEditSequenceRef.current,
              serverVersion: serverVersionRef.current,
            },
          );
        }
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Unable to save chapter.";

        setErrors([message]);

        setSaveState((current) => updateAutosaveState(current, "ERROR"));

        /*
         * A 409 is deliberately NOT retried.
         *
         * The client does not know that its local snapshot is still
         * safe to overwrite the server with.
         */
        saveQueued.current = false;

        console.error(`[ChapterEditor ${instanceIdRef.current}] SAVE FAILED`, {
          source,
          requestVersion,
          serverVersion: serverVersionRef.current,
          editSequence: editSequenceRef.current,
          error: message,
        });
      } finally {
        saveInFlight.current = false;

        /*
         * If newer edits happened while the request was running,
         * schedule exactly one follow-up save.
         */
        if (saveSucceeded && saveQueued.current) {
          saveQueued.current = false;

          if (saveTimer.current) {
            window.clearTimeout(saveTimer.current);
          }

          saveTimer.current = window.setTimeout(() => {
            saveTimer.current = null;

            void persistChapter("autosave-timer");
          }, 150);
        }
      }
    })();

    /*
     * Publish the active save promise.
     *
     * Any subsequent Save draft click or autosave trigger will
     * join this promise rather than creating another request.
     */
    savePromiseRef.current = saveOperation;

    try {
      await saveOperation;
    } finally {
      /*
       * Only the exact operation that owns this promise may clear it.
       */
      if (savePromiseRef.current === saveOperation) {
        savePromiseRef.current = null;
      }
    }
  };

  /*
   * ============================================================
   * SCHEDULE AUTOSAVE
   * ============================================================
   */
  const scheduleAutosave = () => {
    const latestTitle = titleRef.current;

    const latestContent = textRef.current?.value ?? contentRef.current;

    /*
     * Every title/content modification creates a new local
     * editor state.
     */
    editSequenceRef.current += 1;

    setSaveState((current) => updateAutosaveState(current, "DIRTY"));

    /*
     * Recovery storage remains until the corresponding state has
     * definitely been persisted.
     */
    if (recoveryKey) {
      window.localStorage.setItem(
        recoveryKey,
        JSON.stringify({
          title: latestTitle,
          content: latestContent,
          updatedAt: new Date().toISOString(),
        }),
      );
    }

    console.log(`[ChapterEditor ${instanceIdRef.current}] scheduleAutosave`, {
      saveInFlight: saveInFlight.current,
      savePromiseExists: Boolean(savePromiseRef.current),
      serverVersion: serverVersionRef.current,
      editSequence: editSequenceRef.current,
      lastPersistedEditSequence: lastPersistedEditSequenceRef.current,
    });

    /*
     * If a save is already running, don't start another timer.
     *
     * The running save will detect the newer edit and schedule
     * exactly one follow-up save.
     */
    if (saveInFlight.current) {
      saveQueued.current = true;
      return;
    }

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;

      void persistChapter("autosave-timer");
    }, 850);
  };

  /*
   * ============================================================
   * TEXT FORMATTING
   * ============================================================
   */
  const insertFormat = (prefix: string, suffix = prefix) => {
    const textarea = textRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const currentContent = textRef.current?.value ?? contentRef.current;

    const selectedText = currentContent.slice(start, end);

    const nextText = `${currentContent.slice(
      0,
      start,
    )}${prefix}${selectedText}${suffix}${currentContent.slice(end)}`;

    contentRef.current = nextText;
    setContent(nextText);

    scheduleAutosave();
  };

  /*
   * ============================================================
   * IMAGE UPLOAD
   * ============================================================
   */
  const uploadIllustration = async (file: File) => {
    if (!bookId || !chapterRef.current || !useApiWriterContent) {
      return;
    }

    setAssetError(null);

    try {
      const uploaded = await apiWriterRepository.uploadAsset(
        bookId,
        chapterRef.current.id,
        file,
        {
          altText: file.name.replace(/\.[^.]+$/, "") || "Chapter illustration",
        },
      );

      /*
       * Read the latest editor content only after the upload
       * has completed.
       */
      const currentContent = textRef.current?.value ?? contentRef.current;

      const marker = `![${uploaded.asset.altText}](asset:${uploaded.asset.id})`;

      const nextContent = `${currentContent}${
        currentContent ? "\n\n" : ""
      }${marker}`;

      contentRef.current = nextContent;
      setContent(nextContent);

      /*
       * The asset marker is a genuine content modification.
       */
      scheduleAutosave();
    } catch (caught) {
      setAssetError(
        caught instanceof Error
          ? caught.message
          : "Unable to upload illustration.",
      );
    }
  };

  if (!chapter) {
    return <ErrorState title={loadError ?? "Chapter not found"} />;
  }

  return (
    <div
      className="flex flex-col min-h-full"
      style={{
        background: "var(--color-background)",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-10 pb-3 sticky top-0 z-10"
        style={{
          background: "var(--color-background)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <button
          onClick={() => navigate("writer-books")}
          className="p-1.5"
          aria-label="Back to books"
        >
          {" "}
          <ArrowLeft size={20} color="var(--color-accent-primary)" />{" "}
        </button>

        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(event) => {
              const value = event.target.value;

              titleRef.current = value;
              setTitle(value);

              scheduleAutosave();
            }}
            className="w-full bg-transparent text-sm font-display font-semibold outline-none truncate"
            style={{ color: "#f0ece4" }}
            placeholder="Chapter title"
          />

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px]" style={{ color: "#4a6540" }}>
              {wordCount.toLocaleString()} words
            </span>

            <span style={{ color: "#2a3525" }}>·</span>

            {saveState.status === "SAVED" && (
              <StatusBadge
                label="Saved"
                tone={statusToneFor("SAVED")}
                compact
              />
            )}

            {saveState.status === "SAVING" && (
              <span
                className="flex items-center gap-1 text-[9px]"
                style={{ color: "#6a8060" }}
              >
                <Clock size={8} />
                Saving…
              </span>
            )}

            {saveState.status === "DIRTY" && (
              <span className="text-[9px]" style={{ color: "#fbbf24" }}>
                Unsaved
              </span>
            )}

            {saveState.status === "ERROR" && (
              <span className="text-[9px]" style={{ color: "#fb7185" }}>
                {saveState.error ?? "Autosave failed"}
              </span>
            )}

            <span className="text-[9px]" style={{ color: "#4a6540" }}>
              {readTime} min read
            </span>
          </div>
        </div>

        <button
          onClick={() => setPreviewMode((value) => !value)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95"
          style={{
            background: previewMode ? "#4ade80" : "#1e2118",
            color: previewMode ? "#0d1208" : "#4ade80",
          }}
        >
          <Eye size={12} />
          {previewMode ? "Edit" : "Preview"}
        </button>
      </div>

      {!previewMode ? (
        <>
          <div
            className="flex items-center gap-1 px-4 py-2 sticky z-10"
            style={{
              top: 77,
              background: "#131510",
              borderBottom: "1px solid #1e2118",
            }}
          >
            {[
              {
                icon: <Bold size={14} />,
                action: () => insertFormat("**"),
              },
              {
                icon: <Italic size={14} />,
                action: () => insertFormat("_"),
              },
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-9 h-9 flex items-center justify-center rounded-lg active:scale-90 transition-transform"
                style={{
                  color: "#4ade80",
                  background: "#1e2118",
                }}
                type="button"
              >
                {item.icon}
              </button>
            ))}

            {useApiWriterContent && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      void uploadIllustration(file);
                    }

                    event.target.value = "";
                  }}
                />

                <button
                  type="button"
                  aria-label="Insert illustration"
                  className="w-9 h-9 flex items-center justify-center rounded-lg active:scale-90 transition-transform"
                  style={{
                    color: "#4ade80",
                    background: "#1e2118",
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus size={14} />
                </button>
              </>
            )}

            <div className="flex-1" />

            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95"
              style={{
                background: "#4ade80",
                color: "#0d1208",
              }}
              onClick={() => {
                void persistChapter("manual-save");
              }}
            >
              Save draft
            </button>
          </div>

          <div className="flex-1 px-5 pt-4 pb-32">
            <textarea
              ref={textRef}
              value={content}
              onChange={(event) => {
                const value = event.target.value;

                contentRef.current = value;
                setContent(value);

                scheduleAutosave();
              }}
              placeholder="Begin your chapter…"
              className="w-full min-h-[70vh] bg-transparent resize-none outline-none text-base leading-[1.85] font-serif"
              style={{
                color: "#d8d0b8",
                caretColor: "#4ade80",
              }}
            />
          </div>

          <div
            className="mx-5 mb-8 rounded-xl p-4"
            style={{
              background: "#1e2118",
              border: "1px solid #2a3525",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "#4a6540" }}
            >
              Author note (optional)
            </p>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Leave a note for your readers…"
              rows={2}
              className="w-full bg-transparent resize-none outline-none text-xs leading-relaxed"
              style={{ color: "#8a9880" }}
            />
          </div>

          {errors.length > 0 && (
            <div className="mx-5 mb-5 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          {assetError && (
            <div className="mx-5 mb-5 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
              {assetError}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 px-6 py-6 pb-16">
          <h2
            className="font-display text-xl font-semibold mb-1"
            style={{ color: "#f0ece4" }}
          >
            {title || "Untitled chapter"}
          </h2>

          <div
            className="w-8 h-0.5 rounded-full mb-6"
            style={{
              background: "#4ade80",
            }}
          />

          <ChapterContent
            content={content}
            className="text-base leading-[1.85] font-serif"
            style={{ color: "#d8d0b8" }}
          />

          {notes && (
            <div
              className="mt-8 p-4 rounded-xl"
              style={{
                background: "#1e2118",
                border: "1px solid #2a3525",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#4a6540" }}
              >
                Author note
              </p>

              <p className="text-sm italic" style={{ color: "#8a9880" }}>
                {notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
