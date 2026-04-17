import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Send, AlertTriangle, Phone, X } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface BereavementChatProps {
  petId?: string;
  petName?: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  safetyFlag?: boolean;
}

export function BereavementChat({ petId, petName, onClose }: BereavementChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [saveHistory, setSaveHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Cargar historial si el usuario ya consintió antes
  useEffect(() => {
    if (!user || !hasConsented) return;
    const loadHistory = async () => {
      const { data } = await supabase
        .from('bereavement_chat_messages' as 'profiles')
        .select('role, content, safety_flag')
        .eq('user_id', user.id)
        .eq('pet_id', petId || '')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        setSaveHistory(true); // ya tenía historial = ya consintió
        setMessages(
          (
            data as unknown as Array<{
              role: 'user' | 'assistant';
              content: string;
              safety_flag: boolean;
            }>
          ).map((m) => ({ role: m.role, content: m.content, safetyFlag: m.safety_flag }))
        );
      }
    };
    loadHistory();
  }, [user, hasConsented, petId]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Guardar mensaje del usuario si consintió historial
    if (saveHistory && user) {
      supabase
        .from('bereavement_chat_messages' as 'profiles')
        .insert({
          user_id: user.id,
          pet_id: petId || null,
          role: 'user',
          content: userMsg,
        } as Record<string, unknown>)
        .then(() => {});
    }

    try {
      const { data, error } = await supabase.functions.invoke('bereavement-assistant', {
        body: { message: userMsg, pet_id: petId },
      });

      if (error) throw error;

      const assistantMsg = {
        role: 'assistant' as const,
        content: data.reply || 'Estoy aquí contigo.',
        safetyFlag: data.safety_flag,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Guardar respuesta del asistente
      if (saveHistory && user) {
        supabase
          .from('bereavement_chat_messages' as 'profiles')
          .insert({
            user_id: user.id,
            pet_id: petId || null,
            role: 'assistant',
            content: assistantMsg.content,
            safety_flag: assistantMsg.safetyFlag || false,
          } as Record<string, unknown>)
          .then(() => {});
      }
    } catch (err) {
      const isAuthError = err instanceof Error && err.message?.includes('authorization');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isAuthError
            ? 'Tu sesión expiró. Por favor, recarga la página e intenta de nuevo. Si necesitas ayuda ahora, llama a Salud Responde: 600 360 7777.'
            : 'El servicio de acompañamiento no está disponible en este momento. Estamos trabajando para habilitarlo pronto.\n\nMientras tanto, si necesitas hablar con alguien:\n• Salud Responde: 600 360 7777 (24h, gratis)\n• SAMU: 131 (emergencias)',
          safetyFlag: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!hasConsented) {
    return (
      <div className="space-y-5 p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Antes de empezar</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Soy un asistente de Paw Friend para acompañarte en este momento. Quiero ser honesto
          contigo sobre algunas cosas importantes:
        </p>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            Soy un asistente de inteligencia artificial, no una persona.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            No reemplazo a un profesional de salud mental.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            Si necesitas ayuda inmediata, llama a Salud Responde al 600 360 7777 (24h, gratis).
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            Aquí puedes escribirme lo que quieras. No hay respuestas correctas.
          </li>
        </ul>
        <label
          htmlFor="bereavement-save-history"
          className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer"
        >
          <input
            id="bereavement-save-history"
            type="checkbox"
            aria-label="Guardar historial"
            checked={saveHistory}
            onChange={(e) => setSaveHistory(e.target.checked)}
            className="mt-0.5 rounded"
          />
          <span>Guardar esta conversación para poder retomarla después</span>
        </label>
        <Button
          onClick={() => setHasConsented(true)}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Entiendo, quiero conversar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Heart className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Acompañamiento</p>
            {petName && <p className="text-xs text-muted-foreground">Sobre {petName}</p>}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Escríbeme lo que quieras. Estoy aquí para escucharte.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'ml-auto bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              )}
            >
              {msg.content}
            </div>
            {msg.safetyFlag && (
              <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Recursos de ayuda inmediata
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Phone className="h-3 w-3" />
                  Salud Responde: 600 360 7777 (24h, gratis)
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Phone className="h-3 w-3" />
                  SAMU: 131 (emergencias)
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Heart className="h-4 w-4 text-purple-300 animate-pulse" />
            </div>
            <span className="text-xs">Te está leyendo con calma...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe lo que quieras..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
