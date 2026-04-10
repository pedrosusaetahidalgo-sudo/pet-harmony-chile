import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "@/lib/icons";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { logger } from "@/lib/logger";

const ChatConversation = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      loadConversation();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          markAsRead().catch(() => { /* silent: mark-as-read failure is non-critical */ });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadConversation = async () => {
    try {
      setLoading(true);

      // Load conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (convError) throw convError;

      setConversation(convData);

      // Get other user ID
      const otherUserId = convData.participant1_id === user?.id 
        ? convData.participant2_id 
        : convData.participant1_id;

      // Load other user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .maybeSingle();

      setOtherUser(profileData);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);
      markAsRead();
    } catch (error) {
      logger.error('Error loading conversation:', error);
      toast({
        variant: "destructive",
        title: "Algo salió mal",
        description: "No se pudo cargar la conversación"
      });
      navigate('/chat');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      logger.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Algo salió mal",
        description: "No se pudo enviar el mensaje"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Send className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando conversación...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={otherUser?.display_name || "Conversación"}
        subtitle={otherUser?.location || undefined}
        onBack={() => navigate('/chat')}
        actions={
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage src={otherUser?.avatar_url} />
            <AvatarFallback className="bg-warm-gradient text-white">
              {otherUser?.display_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
        }
      />
      <div className="container max-w-2xl mx-auto p-0 h-[calc(100vh-8rem)]">
        <Card className="h-full flex flex-col rounded-none sm:rounded-lg border-0 sm:border">
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showDate = index === 0 || 
                new Date(messages[index - 1].created_at).toDateString() !== 
                new Date(message.created_at).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs bg-muted px-3 py-1 rounded-full">
                        {new Date(message.created_at).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-2xl px-4 py-2`}>
                      <p className="text-sm break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: es
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div className="border-t px-4 pt-3 pb-1">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {[
                  "En horario laboral te respondo. Si es urgencia, llámame",
                  "Para esa duda, te recomiendo agendar consulta",
                  "¿Puedes mandarme una foto?",
                  "Llega 10 minutos antes de tu hora",
                  "Recuerda traer carnet de vacunas",
                ].map((reply) => (
                  <button
                    key={reply}
                    onClick={() => setNewMessage(reply)}
                    className="flex-shrink-0 text-[11px] px-2.5 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-warm-gradient"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ChatConversation;
