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
import { useStartConversation } from "@/hooks/useStartConversation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
  const [followedUsers, setFollowedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadFollowedUsers();
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

  const loadFollowedUsers = async () => {
    if (!user) return;
    
    try {
      // Get users the current user is following
      const { data: followingData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      
      if (!followingData || followingData.length === 0) {
        setFollowedUsers([]);
        return;
      }
      
      const followingIds = followingData.map(f => f.following_id);
      
      // Check which of these users also follow back (mutual follow)
      const { data: mutualFollows } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", user.id)
        .in("follower_id", followingIds);
      
      const mutualFollowIds = new Set(mutualFollows?.map(m => m.follower_id) || []);
      
      // Get profiles of mutually followed users
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", Array.from(mutualFollowIds));
      
      setFollowedUsers(profilesData || []);
    } catch (error) {
      console.error('Error loading followed users:', error);
    }
  };

  const { startConversation } = useStartConversation();
  
  const filteredConversations = conversations.filter(conv => {
    const otherUser = profiles.get(conv.otherUserId);
    return otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredFollowedUsers = followedUsers.filter(user => {
    return user.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
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
      <div className="container max-w-2xl mx-auto p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-warm-gradient bg-clip-text text-transparent">
            Mensajes
          </h1>
          <Button
            onClick={() => setShowNewMessage(!showNewMessage)}
            size="sm"
            className="bg-warm-gradient hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
        </div>
        
        {/* Search Bar - Instagram-like */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={showNewMessage ? "Buscar entre usuarios que sigues..." : "Buscar conversaciones..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-2 focus:border-primary transition-all"
          />
        </div>

        {/* New Message - Show followed users */}
        {showNewMessage && (
          <Card className="mb-4 border-2">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-sm">Nuevo mensaje</h3>
              {filteredFollowedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? "No se encontraron usuarios" : "Sigue a usuarios para poder enviarles mensajes"}
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredFollowedUsers.map((followedUser) => (
                    <div
                      key={followedUser.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        startConversation(followedUser.id);
                        setShowNewMessage(false);
                        setSearchQuery("");
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={followedUser.avatar_url} />
                        <AvatarFallback className="bg-warm-gradient text-white">
                          {followedUser.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {followedUser.display_name || 'Usuario'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
          <div className="space-y-1">
            {filteredConversations.map((conv) => {
              const otherUser = profiles.get(conv.otherUserId);
              const isUnread = conv.unreadCount > 0;
              
              return (
                <Card 
                  key={conv.id}
                  className="cursor-pointer hover:bg-muted/50 transition-all border-0 shadow-none rounded-lg"
                  onClick={() => navigate(`/chat/${conv.id}`)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/20 flex-shrink-0">
                        <AvatarImage src={otherUser?.avatar_url} />
                        <AvatarFallback className="bg-warm-gradient text-white text-sm">
                          {(() => {
                            if (otherUser?.display_name) {
                              const nameParts = otherUser.display_name.trim().split(/\s+/);
                              if (nameParts.length >= 2) {
                                return `${nameParts[0][0].toUpperCase()}.${nameParts[nameParts.length - 1][0].toUpperCase()}.`;
                              }
                              return otherUser.display_name[0].toUpperCase();
                            }
                            return '?';
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold truncate text-sm sm:text-base ${isUnread ? 'text-foreground' : 'text-foreground'}`}>
                            {otherUser?.display_name || 'Usuario'}
                          </h3>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatDistanceToNow(new Date(conv.lastMessage.created_at), {
                                addSuffix: true,
                                locale: es
                              })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate flex-1 ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {conv.lastMessage?.content || 'Sin mensajes aún'}
                          </p>
                          {isUnread && (
                            <div className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 min-w-[20px] flex items-center justify-center">
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
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
