import { useState, useEffect, useCallback } from 'react';
import { X } from '@/lib/icons';
import type { StoryGroup } from '@/hooks/usePetStories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface FeedStoryViewerProps {
  group: StoryGroup;
  onClose: () => void;
  onNextGroup: () => void;
  onPrevGroup: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export function FeedStoryViewer({
  group,
  onClose,
  onNextGroup,
  onPrevGroup,
}: FeedStoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const story = group.stories[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onNextGroup();
    }
  }, [currentIndex, group.stories.length, onNextGroup]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    } else {
      onPrevGroup();
    }
  }, [currentIndex, onPrevGroup]);

  // Auto-advance timer
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + 100 / (STORY_DURATION / 50);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, group.petId, goNext]);

  // Reset index when group changes
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [group.petId]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-[env(safe-area-inset-top,8px)]">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-75"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 mt-[env(safe-area-inset-top,8px)]">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-2 ring-white/50">
            <AvatarImage src={group.petPhoto || undefined} />
            <AvatarFallback className="bg-white/20 text-white text-xs">
              {group.petName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white text-sm font-semibold">{group.petName}</p>
            <p className="text-white/60 text-xs">
              {formatDistanceToNow(new Date(story.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-white p-2 hover:bg-white/10 rounded-full">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Story image */}
      <img
        src={story.media_url}
        alt={story.caption || group.petName}
        className="max-h-full max-w-full object-contain w-full h-full"
      />

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/60 to-transparent pb-[env(safe-area-inset-bottom,16px)]">
          <p className="text-white text-sm text-center">{story.caption}</p>
        </div>
      )}

      {/* Tap zones */}
      <button
        onClick={goPrev}
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        aria-label="Anterior"
      />
      <button
        onClick={goNext}
        className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        aria-label="Siguiente"
      />
    </div>
  );
}
