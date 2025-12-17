import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      const { data: convData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!messages_conversation_id_fkey(
            content,
            created_at,
            sender_id,
            read_at
          )
        `)
        .or(`participant1_id.eq.${user?.id},participant2_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get unique participant IDs
      const participantIds = new Set<string>();
      convData?.forEach(conv => {
        participantIds.add(conv.participant1_id);
        participantIds.add(conv.participant2_id);
      });

      // Load profiles
      if (participantIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', Array.from(participantIds));

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
        setProfiles(profilesMap);
      }

      // Process conversations to get last message
      const processedConversations = convData?.map(conv => {
        const messages = conv.messages || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const otherUserId = conv.participant1_id === user?.id 
          ? conv.participant2_id 
          : conv.participant1_id;
        
        return {
          ...conv,
          lastMessage,
          otherUserId,
          unreadCount: messages.filter((m: any) => 
            m.sender_id !== user?.id && !m.read_at
          ).length
        };
      }) || [];

      setConversations(processedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = profiles.get(conv.otherUserId);
    return otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando conversaciones...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-warm-gradient bg-clip-text text-transparent">
            Mensajes
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hay conversaciones</h3>
              <p className="text-muted-foreground">
                Comienza a seguir a otros usuarios para chatear con ellos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => {
              const otherUser = profiles.get(conv.otherUserId);
              const isUnread = conv.unreadCount > 0;
              
              return (
                <Card 
                  key={conv.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/chat/${conv.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                        <AvatarImage src={otherUser?.avatar_url} />
                        <AvatarFallback className="bg-warm-gradient text-white">
                          {otherUser?.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {otherUser?.display_name || 'Usuario'}
                          </h3>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.lastMessage.created_at), {
                                addSuffix: true,
                                locale: es
                              })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {conv.lastMessage?.content || 'Sin mensajes aún'}
                          </p>
                          {isUnread && (
                            <div className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2">
                              {conv.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Chat;
