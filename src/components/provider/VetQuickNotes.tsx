import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, StickyNote } from '@/lib/icons';
import { useVetQuickNotes } from '@/hooks/useVetQuickNotes';
import { cn } from '@/lib/utils';

const NOTE_COLORS = {
  yellow: 'bg-yellow-50 border-yellow-200',
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  pink: 'bg-pink-50 border-pink-200',
  gray: 'bg-gray-50 border-gray-200',
} as const;

interface Props {
  petId: string;
  providerId: string;
  petName: string;
}

export function VetQuickNotes({ petId, providerId, petName }: Props) {
  const { notes, isLoading, addNote, deleteNote } = useVetQuickNotes(petId, providerId);
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');

  const handleAdd = () => {
    if (!newContent.trim()) return;
    addNote.mutate(
      { content: newContent.trim() },
      {
        onSuccess: () => {
          setNewContent('');
          setShowAdd(false);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-500" />
            Notas rápidas
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAdd && (
          <div className="space-y-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={`Nota sobre ${petName}...`}
              className="min-h-[60px] text-sm bg-transparent border-0 p-0 resize-none focus-visible:ring-0"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">{newContent.length}/500</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setShowAdd(false);
                    setNewContent('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleAdd}
                  disabled={!newContent.trim() || addNote.isPending}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading && <p className="text-xs text-muted-foreground">Cargando notas...</p>}

        {!isLoading && notes.length === 0 && !showAdd && (
          <p className="text-xs text-muted-foreground py-2 text-center">
            Sin notas para {petName}. Agrega una para recordar detalles importantes.
          </p>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className={cn(
              'p-2.5 rounded-lg border text-sm relative group',
              NOTE_COLORS[note.color]
            )}
          >
            <p className="whitespace-pre-wrap pr-6">{note.content}</p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteNote.mutate(note.id)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
