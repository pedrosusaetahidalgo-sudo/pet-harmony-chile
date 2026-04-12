import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from '@/lib/icons';
import { useActiveStories, useCreateStory, type StoryGroup } from '@/hooks/usePetStories';
import { useAuth } from '@/hooks/useAuth';
import { FeedStoryViewer } from './FeedStoryViewer';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function FeedStories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: storyGroups = [] } = useActiveStories();
  const createStory = useCreateStory();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [pets, setPets] = useState<{ id: string; name: string }[]>([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('pets')
      .select('id, name')
      .eq('owner_id', user.id)
      .then(({ data }) => {
        if (data) {
          setPets(data);
          if (data.length > 0) setSelectedPetId(data[0].id);
        }
      });
  }, [user]);

  const handleOpenStory = (group: StoryGroup) => {
    const idx = storyGroups.indexOf(group);
    setViewingIndex(idx);
    setViewingGroup(group);
  };

  const handleNextGroup = () => {
    const nextIdx = viewingIndex + 1;
    if (nextIdx < storyGroups.length) {
      setViewingIndex(nextIdx);
      setViewingGroup(storyGroups[nextIdx]);
    } else {
      setViewingGroup(null);
    }
  };

  const handlePrevGroup = () => {
    const prevIdx = viewingIndex - 1;
    if (prevIdx >= 0) {
      setViewingIndex(prevIdx);
      setViewingGroup(storyGroups[prevIdx]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
  };

  const handleCreateStory = async () => {
    if (!storyFile || !selectedPetId) return;
    try {
      await createStory.mutateAsync({
        petId: selectedPetId,
        file: storyFile,
      });
      toast({ title: '¡Historia publicada!' });
      setShowCreate(false);
      setStoryFile(null);
      setStoryPreview('');
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo subir la historia' });
    }
  };

  return (
    <>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-hide">
        {/* Create story button */}
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/40">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground w-16 text-center truncate">
              Tu historia
            </span>
          </button>
        )}

        {/* Story circles */}
        {storyGroups.map((group) => (
          <button
            key={group.petId}
            onClick={() => handleOpenStory(group)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div
              className={cn(
                'h-16 w-16 rounded-full p-0.5',
                group.hasUnseen
                  ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400'
                  : 'bg-muted-foreground/30'
              )}
            >
              <Avatar className="h-full w-full border-2 border-background">
                <AvatarImage src={group.petPhoto || undefined} />
                <AvatarFallback className="bg-warm-gradient text-white text-xs font-semibold">
                  {group.petName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[10px] text-foreground w-16 text-center truncate">
              {group.petName}
            </span>
          </button>
        ))}
      </div>

      {/* Story viewer */}
      {viewingGroup && (
        <FeedStoryViewer
          group={viewingGroup}
          onClose={() => setViewingGroup(null)}
          onNextGroup={handleNextGroup}
          onPrevGroup={handlePrevGroup}
        />
      )}

      {/* Create story dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva historia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pets.length > 0 && (
              <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona mascota" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {storyPreview ? (
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden max-h-64">
                <img src={storyPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    setStoryFile(null);
                    setStoryPreview('');
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                >
                  <Plus className="h-4 w-4 rotate-45" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="story-file-input"
                className="block aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                  <span className="text-sm text-muted-foreground">Seleccionar foto</span>
                </div>
                <input
                  id="story-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}

            <Button
              onClick={handleCreateStory}
              disabled={!storyFile || !selectedPetId || createStory.isPending}
              className="w-full bg-warm-gradient"
            >
              {createStory.isPending ? 'Subiendo...' : 'Publicar historia'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
