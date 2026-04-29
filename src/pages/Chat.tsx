import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Search } from '@/lib/icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStartConversation } from '@/hooks/useStartConversation';
import { Button } from '@/components/ui/button';
import { Plus } from '@/lib/icons';
import { logger } from '@/lib/logger';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

interface ProcessedConversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string | null;
  lastMessage: Pick<MessageRow, 'content' | 'created_at' | 'sender_id' | 'read_at'> | null;
  otherUserId: string;
  unreadCount: number;
}

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startConversation: startConvo } = useStartConversation();
  const { blockedIds } = useBlockedUsers();
  const [conversations, setConversations] = useState<ProcessedConversation[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());
  const [followedUsers, setFollowedUsers] = useState<
    Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url'>[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadFollowedUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadConversations/loadFollowedUsers depend on user from closure; adding them would cause infinite loops
  }, [user]);

  // Handle ?user= query param to auto-open conversation
  // Wait until conversations are loaded to avoid race condition
  useEffect(() => {
    if (loading) return;
    const targetUserId = searchParams.get('user');
    if (targetUserId && user && targetUserId !== user.id) {
      startConvo(targetUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startConvo is stable from hook; only re-run when loading/searchParams/user change
  }, [searchParams, user, loading]);

  // Realtime filtrada por conversaciones del usuario
  useEffect(() => {
    if (!user || conversations.length === 0) return;

    const convIds = conversations.map((c) => c.id);
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${convIds.join(',')})`,
        },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- conversations (array) cambia en cada loadConversations, solo re-suscribimos cuando length cambia
  }, [user, conversations.length]);

  const loadConversations = async () => {
    try {
      setLoading(true);

      const { data: convData, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          messages!messages_conversation_id_fkey(
            content,
            created_at,
            sender_id,
            read_at
          )
        `
        )
        .or(`participant1_id.eq.${user?.id},participant2_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false })
        .limit(1, { referencedTable: 'messages' });

      if (error) throw error;

      // Get unique participant IDs
      const participantIds = new Set<string>();
      convData?.forEach((conv) => {
        participantIds.add(conv.participant1_id);
        participantIds.add(conv.participant2_id);
      });

      // Load profiles
      if (participantIds.size > 0) {
        // Sprint 1 P1 PERF-003: solo lo que la lista de chats muestra
        // (avatar + nombre). Nada de plan/admin/PII.
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', Array.from(participantIds));

        const profilesMap = new Map();
        profilesData?.forEach((profile) => {
          profilesMap.set(profile.id, profile);
        });
        setProfiles(profilesMap);
      }

      // Process conversations to get last message
      const processedConversations =
        convData?.map((conv) => {
          const messages = conv.messages || [];
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          const otherUserId =
            conv.participant1_id === user?.id ? conv.participant2_id : conv.participant1_id;

          return {
            ...conv,
            lastMessage,
            otherUserId,
            unreadCount: messages.filter(
              (m: { sender_id: string; read_at: string | null }) =>
                m.sender_id !== user?.id && !m.read_at
            ).length,
          };
        }) || [];

      // Filter out conversations with blocked users
      const filtered = processedConversations.filter((c) => !blockedIds.has(c.otherUserId));
      setConversations(filtered);
    } catch (error) {
      logger.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowedUsers = async () => {
    if (!user) return;

    try {
      // Get users the current user is following
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!followingData || followingData.length === 0) {
        setFollowedUsers([]);
        return;
      }

      const followingIds = followingData.map((f) => f.following_id);

      // Check which of these users also follow back (mutual follow)
      const { data: mutualFollows } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', user.id)
        .in('follower_id', followingIds);

      const mutualFollowIds = new Set(mutualFollows?.map((m) => m.follower_id) || []);

      // Get profiles of mutually followed users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(mutualFollowIds));

      setFollowedUsers(profilesData || []);
    } catch (error) {
      logger.error('Error loading followed users:', error);
    }
  };

  const { startConversation } = useStartConversation();

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = profiles.get(conv.otherUserId);
    return otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredFollowedUsers = followedUsers.filter((user) => {
    return user.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <>
        <PageHeader title="Mensajes" />
        <div className="container max-w-2xl mx-auto p-4 sm:p-6 space-y-3 animate-fade-in">
          <div className="h-11 rounded-xl skeleton" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 skeleton" />
                <div className="h-3 w-48 skeleton" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Mensajes"
        actions={
          <Button
            onClick={() => setShowNewMessage(!showNewMessage)}
            size="sm"
            className="bg-warm-gradient hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
        }
      />
      <div className="container max-w-2xl mx-auto p-4 sm:p-6">
        {/* Search Bar - Instagram-like */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              showNewMessage ? 'Buscar entre usuarios que sigues...' : 'Buscar conversaciones...'
            }
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
                  {searchQuery
                    ? 'No se encontraron usuarios'
                    : 'Sigue a usuarios para poder enviarles mensajes'}
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
                        setSearchQuery('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          startConversation(followedUser.id);
                          setShowNewMessage(false);
                          setSearchQuery('');
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={followedUser.avatar_url ?? undefined} />
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
          // Si "Nuevo mensaje" está abierto, la card de arriba ya guía al
          // usuario; no duplicamos con el empty state principal.
          showNewMessage ? null : (
            <EmptyState
              illustration="/paw-friend-assets-v2/illustrations/empty-states/no_conversations.svg"
              icon={MessageCircle}
              title="Sin conversaciones"
              description="Empieza una conversación con tu vet o con alguien que sigas."
              actionLabel="Buscar veterinarios"
              actionUrl="/veterinarios"
            />
          )
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/chat/${conv.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/20 flex-shrink-0">
                        <AvatarImage src={otherUser?.avatar_url ?? undefined} />
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
                          <h3
                            className={`font-semibold truncate text-sm sm:text-base ${isUnread ? 'text-foreground' : 'text-foreground'}`}
                          >
                            {otherUser?.display_name || 'Usuario'}
                          </h3>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatDistanceToNow(new Date(conv.lastMessage.created_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm truncate flex-1 ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                          >
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
    </>
  );
};

export default Chat;
