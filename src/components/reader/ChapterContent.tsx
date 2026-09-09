import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChapterContentProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ChapterContent({
  content,
  className,
  style,
}: ChapterContentProps) {
  return (
    <div className={className} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-2xl font-semibold mb-5">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="font-display text-xl font-semibold mb-4">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="font-display text-lg font-semibold mb-3">
              {children}
            </h3>
          ),

          p: ({ children }) => <p className="reader-paragraph">{children}</p>,

          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),

          em: ({ children }) => <em>{children}</em>,

          code: ({ children, className }) => {
            const isBlock = Boolean(className);

            if (isBlock) {
              return (
                <pre className="my-4 overflow-x-auto rounded-xl p-4 bg-black/20">
                  <code className={className}>{children}</code>
                </pre>
              );
            }

            return (
              <code className="rounded px-1 py-0.5 bg-black/10 font-mono text-[0.9em]">
                {children}
              </code>
            );
          },

          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 pl-4 italic opacity-80">
              {children}
            </blockquote>
          ),

          ul: ({ children }) => (
            <ul className="my-4 ml-6 list-disc space-y-2">{children}</ul>
          ),

          ol: ({ children }) => (
            <ol className="my-4 ml-6 list-decimal space-y-2">{children}</ol>
          ),

          li: ({ children }) => <li>{children}</li>,

          hr: () => <hr className="my-8 border-current opacity-20" />,

          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
