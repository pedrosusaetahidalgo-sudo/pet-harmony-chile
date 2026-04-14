import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users, MessageCircle, Search, Send, ArrowLeft, Heart } from '@/lib/icons';
import {
  useCommunityGroups,
  useMyGroupMemberships,
  useJoinGroup,
  useLeaveGroup,
  useGroupMessages,
  useSendGroupMessage,
  type CommunityGroup,
} from '@/hooks/useCommunityGroups';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Community() {
  const { slug } = useParams<{ slug: string }>();

  if (slug) return <GroupChat slug={slug} />;
  return <GroupList />;
}

function GroupList() {
  const navigate = useNavigate();
  const { data: groups, isLoading } = useCommunityGroups();
  const { data: myGroups } = useMyGroupMemberships();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const [search, setSearch] = useState('');

  const filtered = (groups || []).filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Comunidad" subtitle="Grupos por raza, condición o interés" back />
      <main className="container max-w-2xl mx-auto px-3 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title="Sin grupos todavía"
            description="Los grupos de comunidad estarán disponibles pronto."
          />
        )}

        {filtered.map((group) => {
          const isMember = myGroups?.includes(group.id);
          return (
            <Card
              key={group.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (isMember) {
                  navigate(`/comunidad/${group.slug}`);
                }
              }}
            >
              <CardContent className="py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <GroupIcon type={group.group_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {group.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {group.category}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {group.member_count} miembro{group.member_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isMember ? 'outline' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMember) {
                      leaveGroup.mutate(group.id);
                    } else {
                      joinGroup.mutate(group.id, {
                        onSuccess: () => navigate(`/comunidad/${group.slug}`),
                      });
                    }
                  }}
                  disabled={joinGroup.isPending || leaveGroup.isPending}
                  className="shrink-0"
                >
                  {isMember ? 'Salir' : 'Unirse'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </main>
    </div>
  );
}

function GroupChat({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups } = useCommunityGroups();
  const group = groups?.find((g) => g.slug === slug);
  const { data: messages, isLoading } = useGroupMessages(group?.id);
  const sendMessage = useSendGroupMessage();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages?.length]);

  const handleSend = () => {
    if (!text.trim() || !group) return;
    sendMessage.mutate({ groupId: group.id, content: text });
    setText('');
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Grupo" back />
        <main className="container max-w-2xl mx-auto px-3 py-4">
          <EmptyState
            icon={Users}
            title="Grupo no encontrado"
            description="Este grupo no existe o no está disponible."
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-3 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/comunidad')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{group.name}</h2>
          <p className="text-[10px] text-muted-foreground">
            {group.member_count} miembro{group.member_count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-3/4 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && (!messages || messages.length === 0) && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            Sé el primero en escribir en este grupo
          </div>
        )}

        {messages?.map((msg) => {
          const isOwn = msg.user_id === user?.id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profile = msg.profiles as any;
          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-8 w-8 shrink-0">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="text-xs">
                  {(profile?.display_name || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[75%] ${isOwn ? 'text-right' : ''}`}>
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  {profile?.display_name || 'Anónimo'} ·{' '}
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: es })}
                </p>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    isOwn ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-muted rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t px-3 py-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          className="bg-purple-600 hover:bg-purple-700 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function GroupIcon({ type }: { type: string | null }) {
  switch (type) {
    case 'breed':
      return <Heart className="h-6 w-6 text-purple-600" />;
    case 'condition':
      return <Heart className="h-6 w-6 text-red-500" />;
    default:
      return <Users className="h-6 w-6 text-purple-600" />;
  }
}
