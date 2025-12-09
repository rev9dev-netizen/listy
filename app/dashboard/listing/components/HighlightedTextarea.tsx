"use client";
import { Textarea } from "@/components/ui/textarea";
import { forwardRef, useRef, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  keywords?: string[]; // Selected keywords for highlighting
  allKeywords?: string[]; // All available keywords for autocomplete
  className?: string;
}

export const HighlightedTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, placeholder, rows = 3, keywords = [], allKeywords = [], className }, ref) => {
    const backgroundRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Autocomplete State
    const [suggestionState, setSuggestionState] = useState<{
      isOpen: boolean;
      query: string;
      position: { top: number; left: number };
      activeIndex: number;
    }>({ isOpen: false, query: '', position: { top: 0, left: 0 }, activeIndex: 0 });

    // Combine refs
    useEffect(() => {
      if (ref && textareaRef.current) {
        if (typeof ref === 'function') {
          ref(textareaRef.current);
        } else {
          ref.current = textareaRef.current;
        }
      }
    }, [ref]);

    // Synchronize scroll
    const handleScroll = () => {
      if (backgroundRef.current && textareaRef.current) {
        backgroundRef.current.scrollTop = textareaRef.current.scrollTop;
        backgroundRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
      setSuggestionState(prev => ({ ...prev, isOpen: false })); // Close on scroll
    };

    // Filter suggestions
    const suggestions = useMemo(() => {
        if (!suggestionState.isOpen || !allKeywords.length) return [];
        const q = suggestionState.query.toLowerCase();
        return allKeywords.filter(k => k.toLowerCase().startsWith(q)).slice(0, 50); // Limit results
    }, [allKeywords, suggestionState.isOpen, suggestionState.query]);

    // Input Handler for Trigger Detection
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e);
        
        const el = e.target;
        const text = el.value;
        const caretPos = el.selectionEnd;
        
        // Check for @ trigger before cursor
        // Regex: (start or space) @ (chars) cursor
        const textBeforeCursor = text.substring(0, caretPos);
        const match = textBeforeCursor.match(/(?:^|\s)@(\w*)$/);

        if (match && allKeywords.length > 0) {
            const query = match[1];
            const coordinates = getCaretCoordinates(el, caretPos);
            
            // Adjust coordinates to be relative to viewport or reliable container
            // For simplicity, we might render portal relative to the textarea
            // But getting exact pixel pos relative to screen is best for Portal
            const rect = el.getBoundingClientRect();
            
            setSuggestionState({
                isOpen: true,
                query,
                position: { 
                    top: rect.top + coordinates.top + 24 + window.scrollY, // line height approx
                    left: rect.left + coordinates.left + window.scrollX
                },
                activeIndex: 0
            });
        } else {
            setSuggestionState(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!suggestionState.isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestionState(prev => ({ ...prev, activeIndex: (prev.activeIndex + 1) % suggestions.length }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestionState(prev => ({ ...prev, activeIndex: (prev.activeIndex - 1 + suggestions.length) % suggestions.length }));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            selectSuggestion(suggestions[suggestionState.activeIndex]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSuggestionState(prev => ({ ...prev, isOpen: false }));
        }
    };

    const selectSuggestion = (keyword: string) => {
        if (!textareaRef.current) return;
        const el = textareaRef.current;
        const text = el.value;
        const caretPos = el.selectionEnd;
        const textBefore = text.substring(0, caretPos);
        const match = textBefore.match(/@(\w*)$/);
        
        if (match) {
            const matchLength = match[0].length; // @query
            const newText = text.substring(0, caretPos - matchLength) + keyword + text.substring(caretPos);
            
            // Need to update parent state via onChange logic simulation or exposed modifier
            // Since onChange expects an event, we need to manually trigger it or refactor props
            // Standard hack: set value and dispatch event
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(el, newText);
                const ev = new Event('input', { bubbles: true });
                el.dispatchEvent(ev);
            }
        }
        setSuggestionState(prev => ({ ...prev, isOpen: false }));
    };

    // Generate highlighted HTML (Same as before with removed padding fix)
    const highlightedHtml = useMemo(() => {
      if (!value || keywords.length === 0) {
        return escapeHtml(value || '');
      }

      // Sort keywords by length (longest first)
      const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

      // Regex
      const pattern = sortedKeywords
        .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");

      if (!pattern) {
        return escapeHtml(value);
      }

      const regex = new RegExp(`(${pattern})`, "gi");
      const parts = value.split(regex);

      let html = '';
      parts.forEach((part) => {
        const isKeyword = sortedKeywords.some(
          (kw) => kw.toLowerCase() === part.toLowerCase()
        );

        if (isKeyword) {
          html += `<mark class="bg-blue-200 dark:bg-blue-600 text-transparent rounded-sm">${escapeHtml(part)}</mark>`;
        } else {
          html += escapeHtml(part);
        }
      });

      return html;
    }, [value, keywords]);

    return (
      <div className="relative">
        {/* Background layer */}
        <div
          ref={backgroundRef}
          className="absolute inset-0 overflow-hidden whitespace-pre-wrap break-words pointer-events-none"
          style={{
            padding: '8px 12px',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            fontFamily: 'inherit',
            color: 'transparent',
            border: '1px solid transparent',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />

        {/* Foreground textarea */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput} // Intercept onChange
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          rows={rows}
          className={`relative ${className}`}
          style={{
            background: 'transparent',
            color: 'hsl(var(--foreground))',
          }}
        />

        {/* Suggestion Portal */}
        {suggestionState.isOpen && suggestions.length > 0 && typeof document !== 'undefined' && createPortal(
            <ul 
                className="fixed z-50 bg-popover text-popover-foreground border rounded-md shadow-md overflow-hidden min-w-[150px] max-h-[200px] overflow-y-auto p-1"
                style={{
                    top: suggestionState.position.top,
                    left: suggestionState.position.left
                }}
            >
                {suggestions.map((s, i) => (
                    <li 
                        key={s}
                        className={`text-sm px-2 py-1.5 cursor-pointer rounded-sm ${i === suggestionState.activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                        onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            selectSuggestion(s);
                        }}
                    >
                        {s}
                    </li>
                ))}
            </ul>
        , document.body)}
      </div>
    );
  }
);

HighlightedTextarea.displayName = "HighlightedTextarea";

// Utils
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Basic Caret Coordinator (Simplified)
// Calculates pixel coordinates of caret in textarea
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const div = document.createElement('div');
  const style = window.getComputedStyle(element);
  
  // Copy styles
  Array.from(style).forEach((prop) => {
    div.style.setProperty(prop, style.getPropertyValue(prop));
  });

  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.width = style.width; // important for wrapping
  div.style.height = 'auto';
  
  // Content before caret
  div.textContent = element.value.substring(0, position);
  
  // Marker span
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);
  
  document.body.appendChild(div);
  
  const coordinates = {
    top: span.offsetTop - element.scrollTop,
    left: span.offsetLeft - element.scrollLeft
  };
  
  document.body.removeChild(div);
  
  return coordinates;
}
