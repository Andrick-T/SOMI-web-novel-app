import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Clock,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Save,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { apiWriterRepository } from "../../services/repositories/writerRepository";
import type { WriterBook, WriterChapter } from "../../features/writer/types";

const DRAFT_PREFIX = "somi-writer-draft";

function parseRoute() {
  const match = window.location.pathname.match(
    /^\/writer\/books\/([^/]+)\/chapters\/([^/]+)\/edit$/,
  );

  if (!match) {
    return null;
  }

  return {
    bookId: match[1],
    chapterId: match[2],
  };
}

function getWordCount(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(" ").filter(Boolean).length;
}

function getReadingTime(wordCount: number) {
  return Math.max(1, Math.ceil(wordCount / 200));
}

function getInitialContent(rawContent?: string | null) {
  if (!rawContent) {
    return "";
  }

  /*
   * New SOMI chapters created with this editor will contain
   * serialized Tiptap JSON.
   *
   * Existing chapters may still contain Markdown/plain text.
   * For now we return those strings unchanged. Migration of
   * existing Markdown will be handled separately.
   */
  try {
    const parsed = JSON.parse(rawContent);

    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }
  } catch {
    // Existing non-JSON chapter content.
  }

  return rawContent;
}

function ToolbarButton({
  active = false,
  disabled = false,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`somi-editor-tool ${active ? "somi-editor-tool-active" : ""}`}
      disabled={disabled}
      title={title}
      aria-label={title}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

export default function ChapterEditor() {
  const navigate = useNavigate();
  const params = useParams();

  const route = useMemo(() => {
    const parsed = parseRoute();

    return {
      bookId: params.bookId || parsed?.bookId || "",
      chapterId: params.chapterId || parsed?.chapterId || "",
    };
  }, [params.bookId, params.chapterId]);

  const { bookId, chapterId } = route;

  const [book, setBook] = useState<WriterBook | null>(null);
  const [chapter, setChapter] = useState<WriterChapter | null>(null);

  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);

  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titleRef = useRef(title);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "somi-editor-link",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),

      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "somi-editor-image",
        },
      }),

      Underline,
    ],

    content: "",

    editorProps: {
      attributes: {
        class: "somi-editor-prose",
        spellcheck: "true",
      },
    },

    onUpdate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON();
      const text = currentEditor.getText();

      setWordCount(getWordCount(text));
      setSaveState("idle");

      if (localDraftTimer.current) {
        clearTimeout(localDraftTimer.current);
      }

      localDraftTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(
            `${DRAFT_PREFIX}:${bookId}:${chapterId}`,
            JSON.stringify({
              title: titleRef.current,
              content: json,
              updatedAt: new Date().toISOString(),
            }),
          );
        } catch {
          // Local recovery is best-effort.
        }
      }, 500);
    },
  });

  const readingTime = useMemo(() => getReadingTime(wordCount), [wordCount]);

  /*
   * Save the current editor state through the repository's
   * actual saveChapterDraft contract.
   */
  const persistChapter = useCallback(
    async (nextTitle: string, editorInstance = editor) => {
      if (!editorInstance || !chapter || !bookId || !chapterId) {
        return;
      }

      setSaveState("saving");
      setError(null);

      const content = JSON.stringify(editorInstance.getJSON());

      const chapterToSave: WriterChapter = {
        ...chapter,
        id: chapterId,
        bookId,
        title: nextTitle,
        content,
        wordCount: getWordCount(editorInstance.getText()),
        readingTime: getReadingTime(getWordCount(editorInstance.getText())),
      };

      try {
        const result = await apiWriterRepository.saveChapterDraft(
          bookId,
          chapterToSave,
        );

        setChapter(result);

        setSaveState("saved");

        window.setTimeout(() => {
          setSaveState((current) => (current === "saved" ? "idle" : current));
        }, 1800);
      } catch (err) {
        console.error(err);
        setSaveState("error");
        setError("Unable to save this chapter. Please try again.");
      }
    },
    [bookId, chapter, chapterId, editor],
  );

  const scheduleAutosave = useCallback(
    (nextTitle: string, editorInstance = editor) => {
      if (!editorInstance || !chapter) {
        return;
      }

      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        void persistChapter(nextTitle, editorInstance);
      }, 1200);
    },
    [chapter, editor, persistChapter],
  );

  /*
   * Load the book and the exact chapter using the actual
   * repository methods.
   */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bookId || !chapterId) {
        setError("Chapter not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [books, foundChapter] = await Promise.all([
          apiWriterRepository.getWriterBooks(),
          apiWriterRepository.getChapter(bookId, chapterId),
        ]);

        if (cancelled) {
          return;
        }

        const foundBook = books.find((item) => item.id === bookId) || null;

        setBook(foundBook);
        setChapter(foundChapter || null);

        if (!foundChapter) {
          setError("Chapter not found.");
          return;
        }

        const draftKey = `${DRAFT_PREFIX}:${bookId}:${chapterId}`;

        const localDraft = localStorage.getItem(draftKey);

        let draft: {
          title?: string;
          content?: unknown;
        } | null = null;

        if (localDraft) {
          try {
            draft = JSON.parse(localDraft);
          } catch {
            draft = null;
          }
        }

        const nextTitle = draft?.title ?? foundChapter.title ?? "";

        const nextContent =
          draft?.content ?? getInitialContent(foundChapter.content);

        setTitle(nextTitle);
        titleRef.current = nextTitle;

        if (editor) {
          if (
            nextContent &&
            typeof nextContent === "object" &&
            "type" in nextContent
          ) {
            editor.commands.setContent(
              nextContent as Parameters<typeof editor.commands.setContent>[0],
            );
          } else if (typeof nextContent === "string") {
            /*
             * Existing Markdown/plain-text content.
             *
             * We deliberately do not treat it as Tiptap
             * formatting yet. Existing-content migration will
             * be handled separately.
             */
            editor.commands.setContent(nextContent);
          }

          setWordCount(getWordCount(editor.getText()));
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load this chapter.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (editor) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [bookId, chapterId, editor]);

  /*
   * Cleanup timers.
   */
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      if (localDraftTimer.current) {
        clearTimeout(localDraftTimer.current);
      }
    };
  }, []);

  /*
   * Autosave when the chapter title changes.
   */
  useEffect(() => {
    if (!editor || loading || !chapter) {
      return;
    }

    scheduleAutosave(title, editor);
  }, [title, editor, loading, chapter, scheduleAutosave]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    titleRef.current = value;

    if (editor && !loading && chapter) {
      scheduleAutosave(value, editor);
    }
  };

  const handleManualSave = async () => {
    await persistChapter(title, editor);
  };

  const handleBack = () => {
    navigate(`/writer/books/${bookId}`);
  };

  const handleAddLink = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href;

    const url = window.prompt("Enter the URL", previousUrl || "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: url.trim(),
      })
      .run();

    scheduleAutosave(title, editor);
  };

  /*
   * Upload an illustration using the repository's actual
   * uploadAsset(bookId, chapterId, file, metadata) contract.
   */
  const handleAddImage = async () => {
    if (!editor || !bookId || !chapterId) {
      return;
    }

    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      try {
        setAssetError(null);

        const result = await apiWriterRepository.uploadAsset(
          bookId,
          chapterId,
          file,
          {
            altText: file.name,
          },
        );

        if (!result?.url) {
          throw new Error("Image upload did not return a URL.");
        }

        editor
          .chain()
          .focus()
          .setImage({
            src: result.url,
            alt: file.name,
          })
          .run();

        scheduleAutosave(title, editor);
      } catch (err) {
        console.error(err);

        setAssetError("Unable to upload this image.");
      }
    };

    input.click();
  };

  const handleImageUrl = () => {
    if (!editor) {
      return;
    }

    const url = window.prompt("Image URL");

    if (!url?.trim()) {
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({
        src: url.trim(),
      })
      .run();

    scheduleAutosave(title, editor);
  };

  if (loading) {
    return (
      <div className="somi-editor">
        <div className="somi-editor-loading">Loading chapter…</div>
      </div>
    );
  }

  return (
    <div className="somi-editor">
      <header className="somi-editor-header">
        <div className="somi-editor-header-main">
          <button
            type="button"
            className="somi-editor-back"
            onClick={handleBack}
            aria-label="Back to book"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="somi-editor-heading">
            <div className="somi-editor-eyebrow">
              {book?.title || "Book"} · Chapter editor
            </div>

            <div className="somi-editor-heading-meta">
              <span>
                <Clock size={14} />
                {readingTime} min read
              </span>

              <span>{wordCount.toLocaleString()} words</span>
            </div>
          </div>
        </div>

        <div className="somi-editor-header-actions">
          <div
            className={`somi-editor-save-state somi-editor-save-${saveState}`}
          >
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && "Saved"}
            {saveState === "error" && "Save failed"}
            {saveState === "idle" && "Autosave on"}
          </div>

          <button
            type="button"
            className="somi-editor-header-button"
            onClick={() => setPreviewMode((value) => !value)}
          >
            <span>{previewMode ? "Edit" : "Preview"}</span>
          </button>

          <button
            type="button"
            className="somi-editor-header-button somi-editor-header-button-primary"
            onClick={handleManualSave}
            disabled={saveState === "saving" || !chapter}
          >
            <Save size={15} />
            <span>Save</span>
          </button>
        </div>
      </header>

      <div className="somi-editor-workspace">
        <div className="somi-editor-writing-column">
          {!previewMode && (
            <div className="somi-editor-toolbar">
              <div className="somi-editor-toolbar-group">
                <select
                  className="somi-editor-format-select"
                  value={
                    editor?.isActive("heading", {
                      level: 1,
                    })
                      ? "h1"
                      : editor?.isActive("heading", {
                            level: 2,
                          })
                        ? "h2"
                        : editor?.isActive("heading", {
                              level: 3,
                            })
                          ? "h3"
                          : "paragraph"
                  }
                  onChange={(event) => {
                    if (!editor) {
                      return;
                    }

                    const value = event.target.value;

                    if (value === "paragraph") {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({
                          level: Number(value.replace("h", "")) as 1 | 2 | 3,
                        })
                        .run();
                    }

                    scheduleAutosave(title, editor);
                  }}
                  aria-label="Text style"
                >
                  <option value="paragraph">Paragraph</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>
              </div>

              <div className="somi-editor-toolbar-divider" />

              <div className="somi-editor-toolbar-group">
                <ToolbarButton
                  title="Bold"
                  active={editor?.isActive("bold")}
                  onClick={() => {
                    editor?.chain().focus().toggleBold().run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <Bold size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Italic"
                  active={editor?.isActive("italic")}
                  onClick={() => {
                    editor?.chain().focus().toggleItalic().run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <Italic size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Underline"
                  active={editor?.isActive("underline")}
                  onClick={() => {
                    editor?.chain().focus().toggleUnderline().run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <UnderlineIcon size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Strikethrough"
                  active={editor?.isActive("strike")}
                  onClick={() => {
                    editor?.chain().focus().toggleStrike().run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <Strikethrough size={17} />
                </ToolbarButton>
              </div>

              <div className="somi-editor-toolbar-divider" />

              <div className="somi-editor-toolbar-group">
                <ToolbarButton
                  title="Align left"
                  active={editor?.isActive({
                    textAlign: "left",
                  })}
                  onClick={() => {
                    editor?.chain().focus().setTextAlign("left").run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <AlignLeft size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Align center"
                  active={editor?.isActive({
                    textAlign: "center",
                  })}
                  onClick={() => {
                    editor?.chain().focus().setTextAlign("center").run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <AlignCenter size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Align right"
                  active={editor?.isActive({
                    textAlign: "right",
                  })}
                  onClick={() => {
                    editor?.chain().focus().setTextAlign("right").run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <AlignRight size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Justify"
                  active={editor?.isActive({
                    textAlign: "justify",
                  })}
                  onClick={() => {
                    editor?.chain().focus().setTextAlign("justify").run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <AlignJustify size={17} />
                </ToolbarButton>
              </div>

              <div className="somi-editor-toolbar-divider" />

              <div className="somi-editor-toolbar-group">
                <ToolbarButton
                  title="Bulleted list"
                  active={editor?.isActive("bulletList")}
                  onClick={() => {
                    editor?.chain().focus().toggleBulletList().run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <List size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Numbered list"
                  active={editor?.isActive("orderedList")}
                  onClick={() => {
                    editor?.chain().focus().toggleOrderedList().run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <ListOrdered size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Blockquote"
                  active={editor?.isActive("blockquote")}
                  onClick={() => {
                    editor?.chain().focus().toggleBlockquote().run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <Quote size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Horizontal divider"
                  onClick={() => {
                    editor?.chain().focus().setHorizontalRule().run();

                    if (editor) {
                      scheduleAutosave(title, editor);
                    }
                  }}
                >
                  <Minus size={17} />
                </ToolbarButton>
              </div>

              <div className="somi-editor-toolbar-divider" />

              <div className="somi-editor-toolbar-group">
                <ToolbarButton
                  title="Add link"
                  active={editor?.isActive("link")}
                  onClick={handleAddLink}
                >
                  <LinkIcon size={17} />
                </ToolbarButton>

                <ToolbarButton title="Upload image" onClick={handleAddImage}>
                  <ImagePlus size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Insert image from URL"
                  onClick={handleImageUrl}
                >
                  <ImagePlus size={17} />
                </ToolbarButton>
              </div>

              <div className="somi-editor-toolbar-spacer" />

              <div className="somi-editor-toolbar-group">
                <ToolbarButton
                  title="Undo"
                  disabled={!editor?.can().undo()}
                  onClick={() => editor?.chain().focus().undo().run()}
                >
                  <Undo2 size={17} />
                </ToolbarButton>

                <ToolbarButton
                  title="Redo"
                  disabled={!editor?.can().redo()}
                  onClick={() => editor?.chain().focus().redo().run()}
                >
                  <Redo2 size={17} />
                </ToolbarButton>
              </div>
            </div>
          )}

          <div className="somi-editor-writing-area">
            <input
              type="text"
              className="somi-editor-title-input"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Chapter title"
              disabled={previewMode}
            />

            {previewMode ? (
              <div className="somi-editor-preview-content">
                {editor?.getText().trim() ? (
                  <EditorContent editor={editor} />
                ) : (
                  <p className="somi-editor-preview-empty">
                    This chapter is currently empty.
                  </p>
                )}
              </div>
            ) : (
              <EditorContent editor={editor} />
            )}

            {!previewMode && (
              <div className="somi-editor-writing-footer">
                <span>{wordCount.toLocaleString()} words</span>

                <span>·</span>

                <span>Approximately {readingTime} min read</span>
              </div>
            )}
          </div>

          {assetError && <div className="somi-editor-errors">{assetError}</div>}

          {error && <div className="somi-editor-errors">{error}</div>}
        </div>
      </div>
    </div>
  );
}
