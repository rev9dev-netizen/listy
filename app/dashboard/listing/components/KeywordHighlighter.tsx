"use client";
import { useMemo } from "react";

interface Props {
  text: string;
  keywords: string[];
}

export function KeywordHighlighter({ text, keywords }: Props) {
  const highlighted = useMemo(() => {
    if (!text || keywords.length === 0) {
      return <span>{text}</span>;
    }

    // Sort keywords by length (longest first) to match longer phrases before shorter ones
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

    // Create regex pattern for all keywords (case-insensitive)
    const pattern = sortedKeywords
      .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // Escape special regex chars
      .join("|");

    if (!pattern) {
      return <span>{text}</span>;
    }

    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          // Check if this part matches any keyword (case-insensitive)
          const isKeyword = sortedKeywords.some(
            (kw) => kw.toLowerCase() === part.toLowerCase()
          );

          if (isKeyword) {
            return (
              <span
                key={index}
                className="bg-blue-100 text-black dark:bg-blue-100 dark:text-black px-1 rounded font-medium"
              >
                {part}
              </span>
            );
          }

          return <span key={index}>{part}</span>;
        })}
      </>
    );
  }, [text, keywords]);

  return <div className="text-sm leading-relaxed">{highlighted}</div>;
}
