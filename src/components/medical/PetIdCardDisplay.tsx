/**
 * PetIdCardDisplay — cedula digital de la mascota estilo cedula chilena
 *
 * Pilar 1 de la Trinidad del Corazon (Refactor Maestro 2026-04-23 §2.4.1).
 * Se muestra cuando el flag PET_ID_CARD_V1 esta activo y existe registro
 * en tabla pet_id_cards para la mascota.
 *
 * Dos caras:
 * - Frente: foto + nombre + especie/raza + fecha nac + QR + card_number
 * - Reverso: dueño + vet + grupo sanguineo + alergias + emergencia + chip
 *
 * Proporciones CR-80 (cedula real): 85.6 x 53.98 mm → ratio 1.586:1
 */
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCw, Download, Share2 } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface PetIdCardData {
  // Frente
  pet_id: string;
  card_number: string; // ej: PF-2026-A4F29XAB
  pet_name: string;
  species: string;
  breed?: string | null;
  birth_date?: string | null;
  photo_url?: string | null;
  nose_print_hash?: string | null; // ej: NP-A4F29X12
  issued_at?: string | null;

  // Reverso
  owner_name?: string | null;
  owner_phone?: string | null;
  vet_name?: string | null;
  vet_phone?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  emergency_contact?: string | null;
  microchip_number?: string | null;
  gender?: string | null;
  neutered?: boolean | null;
  color?: string | null;
  size?: string | null;
}

interface PetIdCardDisplayProps {
  data: PetIdCardData;
  /** Modo del QR por default (emergency/shared/public/owner_only) */
  qrMode?: 'emergency' | 'shared' | 'public' | 'owner_only';
  /** Si se muestra con controles (flip, download, share) */
  interactive?: boolean;
  /** Callback al descargar PDF */
  onDownload?: () => void;
  /** Callback al compartir */
  onShare?: () => void;
  className?: string;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://pawfriend.cl';

function formatBirthDate(date?: string | null): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function calculateAge(birthDate?: string | null): string {
  if (!birthDate) return '';
  try {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years >= 1) return `${years} año${years > 1 ? 's' : ''}`;
    const months = Math.floor((now.getTime() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  } catch {
    return '';
  }
}

function getSpeciesEmoji(species: string): string {
  const map: Record<string, string> = {
    perro: '🐶',
    gato: '🐱',
    conejo: '🐰',
    hamster: '🐹',
    ave: '🐦',
    tortuga: '🐢',
    pez: '🐟',
    otro: '🐾',
  };
  return map[species.toLowerCase()] || '🐾';
}

export function PetIdCardDisplay({
  data,
  qrMode = 'emergency',
  interactive = true,
  onDownload,
  onShare,
  className,
}: PetIdCardDisplayProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const qrValue = `${BASE_URL}/id/${data.card_number}?mode=${qrMode}`;
  const age = calculateAge(data.birth_date);
  const speciesEmoji = getSpeciesEmoji(data.species);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Card container con proporciones CR-80 */}
      <div className="relative w-full max-w-sm" style={{ aspectRatio: '1.586/1' }}>
        {/* Frente */}
        <Card
          className={cn(
            'absolute inset-0 p-0 overflow-hidden transition-all duration-500 shadow-lg',
            'bg-gradient-to-br from-blue-50 via-white to-purple-50',
            'border-2 border-blue-200/60',
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          {/* Banda superior estilo cedula chilena */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold tracking-wider uppercase">
                República de Chile · Paw Friend
              </span>
            </div>
            <span className="text-[7px] opacity-80 font-mono">#{data.card_number}</span>
          </div>

          <div className="flex h-full">
            {/* Foto + emoji especie */}
            <div className="w-[35%] p-2 flex flex-col items-center gap-1 border-r border-gray-200">
              <div className="w-full aspect-square rounded overflow-hidden bg-gray-100 relative">
                {data.photo_url ? (
                  <img
                    src={data.photo_url}
                    alt={data.pet_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-100 to-gray-200">
                    {speciesEmoji}
                  </div>
                )}
              </div>
              <span className="text-[7px] text-gray-500 uppercase tracking-wide">
                {data.species}
              </span>
            </div>

            {/* Datos principales */}
            <div className="flex-1 p-2 flex flex-col justify-between">
              <div className="space-y-0.5">
                <div>
                  <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">
                    Nombre
                  </p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{data.pet_name}</p>
                </div>

                {data.breed && (
                  <div>
                    <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">
                      Raza
                    </p>
                    <p className="text-[10px] font-medium text-gray-700 leading-tight">
                      {data.breed}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">
                      Nacimiento
                    </p>
                    <p className="text-[10px] font-medium text-gray-700 leading-tight">
                      {formatBirthDate(data.birth_date)}
                    </p>
                    {age && <p className="text-[8px] text-gray-500 leading-tight">({age})</p>}
                  </div>
                  {data.nose_print_hash && (
                    <div>
                      <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">
                        Biometría
                      </p>
                      <p className="text-[9px] font-mono font-semibold text-indigo-600 leading-tight">
                        {data.nose_print_hash}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR chico en la esquina */}
              <div className="flex items-end justify-between pt-1">
                <div className="text-[7px] text-gray-400">
                  Emitida:{' '}
                  {data.issued_at ? new Date(data.issued_at).toLocaleDateString('es-CL') : '—'}
                </div>
                <div className="bg-white p-0.5 rounded border border-gray-200">
                  <QRCodeSVG value={qrValue} size={44} level="M" includeMargin={false} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Reverso */}
        <Card
          className={cn(
            'absolute inset-0 p-0 overflow-hidden transition-all duration-500 shadow-lg',
            'bg-gradient-to-br from-purple-50 via-white to-blue-50',
            'border-2 border-purple-200/60',
            isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-3 py-1.5 flex items-center justify-between">
            <span className="text-[8px] font-bold tracking-wider uppercase">
              Información complementaria
            </span>
            <span className="text-[7px] opacity-80 font-mono">#{data.card_number}</span>
          </div>

          <div className="p-2.5 space-y-1.5 text-[10px]">
            {/* Dueño */}
            <div>
              <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">Dueño</p>
              <p className="font-medium text-gray-800 leading-tight">
                {data.owner_name || '—'}
                {data.owner_phone && (
                  <span className="text-gray-500 ml-1">· {data.owner_phone}</span>
                )}
              </p>
            </div>

            {/* Vet cabecera */}
            <div>
              <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">
                Veterinario de cabecera
              </p>
              <p className="font-medium text-gray-800 leading-tight">
                {data.vet_name || '—'}
                {data.vet_phone && <span className="text-gray-500 ml-1">· {data.vet_phone}</span>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {/* Grupo sanguineo */}
              <div>
                <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">
                  Grupo sanguíneo
                </p>
                <p className="font-semibold text-red-700 leading-tight">{data.blood_type || '—'}</p>
              </div>

              {/* Sexo / esterilizado */}
              <div>
                <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">
                  Sexo
                </p>
                <p className="font-medium text-gray-800 leading-tight">
                  {data.gender === 'macho'
                    ? '♂ Macho'
                    : data.gender === 'hembra'
                      ? '♀ Hembra'
                      : '—'}
                  {data.neutered && ' · Esterilizado'}
                </p>
              </div>
            </div>

            {/* Alergias si hay */}
            {data.allergies && (
              <div>
                <p className="text-[7px] uppercase text-amber-600 tracking-wide font-semibold leading-none">
                  ⚠️ Alergias
                </p>
                <p className="text-[9px] text-amber-800 font-medium leading-tight">
                  {data.allergies}
                </p>
              </div>
            )}

            {/* Condiciones crónicas */}
            {data.chronic_conditions && (
              <div>
                <p className="text-[7px] uppercase text-gray-500 tracking-wide leading-none">
                  Condiciones crónicas
                </p>
                <p className="text-[9px] text-gray-700 leading-tight">{data.chronic_conditions}</p>
              </div>
            )}

            {/* Emergencia */}
            {data.emergency_contact && (
              <div>
                <p className="text-[7px] uppercase text-red-600 tracking-wide font-semibold leading-none">
                  🆘 Contacto de emergencia
                </p>
                <p className="text-[9px] text-red-800 font-medium leading-tight">
                  {data.emergency_contact}
                </p>
              </div>
            )}

            {/* Microchip si hay (al final, dato legal secundario) */}
            {data.microchip_number && (
              <div className="pt-1 border-t border-gray-200">
                <p className="text-[7px] uppercase text-gray-400 tracking-wide leading-none">
                  Microchip (Ley 21.020)
                </p>
                <p className="text-[9px] font-mono text-gray-500 leading-tight">
                  {data.microchip_number}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Controles interactivos */}
      {interactive && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <RotateCw className="h-3 w-3" />
            {isFlipped ? 'Ver frente' : 'Ver reverso'}
          </Button>
          {onDownload && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={onDownload}
            >
              <Download className="h-3 w-3" />
              Descargar PDF
            </Button>
          )}
          {onShare && (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={onShare}>
              <Share2 className="h-3 w-3" />
              Compartir
            </Button>
          )}
        </div>
      )}

      {/* Badge Paw Friend */}
      <Badge variant="outline" className="text-[9px] gap-1 px-2 py-0.5">
        <span>🐾</span>
        <span>Generada por Paw Friend · Identidad biométrica + trámite legal</span>
      </Badge>
    </div>
  );
}
