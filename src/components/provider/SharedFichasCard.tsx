import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, ExternalLink, Plus } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { VetNoteEditor } from "./VetNoteEditor";

interface SharedFichasCardProps {
  providerId: string | null | undefined;
}

interface SharedFichaRow {
  id: string;
  token: string;
  pet_id: string;
  created_at: string;
  expires_at: string;
  pets: {
    name: string | null;
    species: string | null;
    photo_url: string | null;
  } | null;
}

/**
 * Badge/lista de fichas clinicas compartidas con este vet en los ultimos 7 dias.
 * Solo se rendea si hay items. Usa la columna `target_provider_id` del
 * token (migracion 20260408120000_share_target_provider.sql).
 */
export function SharedFichasCard({ providerId }: SharedFichasCardProps) {
  const { data: rows } = useQuery({
    queryKey: ["shared-fichas", providerId],
    queryFn: async () => {
      if (!providerId) return [] as SharedFichaRow[];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data, error } = await supabase
        .from("medical_share_tokens")
        .select("id, token, pet_id, created_at, expires_at, pets(name, species, photo_url)")
        .eq("target_provider_id", providerId)
        .eq("is_revoked", false)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return [] as SharedFichaRow[];
      return (data || []) as unknown as SharedFichaRow[];
    },
    enabled: !!providerId,
  });

  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  if (!rows || rows.length === 0) return null;

  const openShare = (token: string) => {
    window.open(`${window.location.origin}/medical-share/${token}`, "_blank", "noopener");
  };

  const isTokenExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Fichas compartidas contigo
          </CardTitle>
          <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
            {rows.length} esta semana
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => {
          const pet = row.pets;
          const when = formatDistanceToNowStrict(new Date(row.created_at), {
            locale: es,
            addSuffix: false,
          });
          const expired = isTokenExpired(row.expires_at);
          return (
            <div key={row.id} className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                <Avatar className="h-11 w-11">
                  {pet?.photo_url ? <AvatarImage src={pet.photo_url} alt={pet?.name || "Mascota"} /> : null}
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {(pet?.name || "M")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {pet?.name || "Mascota"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {pet?.species ? `${pet.species} · ` : ""}
                    compartido hace {when}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {!expired && providerId && (
                    <Button
                      size="sm"
                      variant={expandedNoteId === row.id ? "secondary" : "outline"}
                      onClick={() =>
                        setExpandedNoteId(expandedNoteId === row.id ? null : row.id)
                      }
                      className="h-11"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nota
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openShare(row.token)}
                    className="h-11"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver ficha
                  </Button>
                </div>
              </div>
              {expandedNoteId === row.id && providerId && (
                <VetNoteEditor
                  shareTokenId={row.id}
                  providerId={providerId}
                  petId={row.pet_id}
                  petName={pet?.name || "Mascota"}
                  onSaved={() => setExpandedNoteId(null)}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
