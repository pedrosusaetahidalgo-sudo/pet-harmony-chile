import { useState } from 'react';

interface FeedPostCaptionProps {
  ownerName: string | null;
  petName: string | null;
  content: string;
  onHashtagClick?: (tag: string) => void;
}

const MAX_LENGTH = 150;

export function FeedPostCaption({
  ownerName,
  petName,
  content,
  onHashtagClick,
}: FeedPostCaptionProps) {
  const [expanded, setExpanded] = useState(false);
  const displayName = petName || ownerName || 'Usuario';
  const isLong = content.length > MAX_LENGTH;
  const visibleText = expanded || !isLong ? content : content.slice(0, MAX_LENGTH);

  // Parse hashtags in text
  const renderText = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <button
            key={i}
            className="text-primary font-medium hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onHashtagClick?.(part.slice(1));
            }}
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="px-4 pb-1">
      <p className="text-sm leading-relaxed">
        <span className="font-semibold mr-1">{displayName}</span>
        {renderText(visibleText)}
        {isLong && !expanded && (
          <button
            className="text-muted-foreground ml-1 hover:underline"
            onClick={() => setExpanded(true)}
          >
            ...mas
          </button>
        )}
      </p>
    </div>
  );
}
