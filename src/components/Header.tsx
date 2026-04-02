import { SidebarTrigger } from "@/components/ui/sidebar";
import { Heart, PawPrint, Bell, Crown, MessageSquare, Clock, AlertCircle, UserPlus, MessageCircle, Calendar, CheckCircle, Star, Trophy, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const notificationIconMap: Record<string, { icon: React.ElementType; color: string }> = {
  reminder_due: { icon: Clock, color: "text-amber-500" },
  reminder_overdue: { icon: AlertCircle, color: "text-red-500" },
  new_follower: { icon: UserPlus, color: "text-blue-500" },
  post_liked: { icon: Heart, color: "text-pink-500" },
  post_commented: { icon: MessageCircle, color: "text-green-500" },
  booking_confirmed: { icon: Calendar, color: "text-purple-500" },
  booking_completed: { icon: CheckCircle, color: "text-green-500" },
  new_review: { icon: Star, color: "text-amber-500" },
  level_up: { icon: Trophy, color: "text-yellow-500" },
  streak_milestone: { icon: Flame, color: "text-orange-500" },
};

function getNotificationIcon(type: string) {
  return notificationIconMap[type] || { icon: Bell, color: "text-gray-400" };
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return `hace ${Math.floor(days / 7)}sem`;
}


export const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [msgUnreadCount, setMsgUnreadCount] = useState(0);
  const { notifications, unreadCount: notifUnreadCount, markAsRead, markAllRead } = useNotifications();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUnreadMsgs();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('header-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => loadUnreadMsgs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      setProfile(data);
      // Use profile data for level/points (single source of truth)
      setUserStats(data ? { level: data.level || 1, points: data.points || 0 } : null);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadUnreadMsgs = async () => {
    if (!user) return;

    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

    if (!conversations || conversations.length === 0) return;

    const convIds = conversations.map(c => c.id);

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .is('read_at', null);

    setMsgUnreadCount(count || 0);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 sm:h-16 items-center px-2 sm:px-4 gap-1 sm:gap-4">
        <SidebarTrigger className="md:hidden hover:bg-accent rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors" />
        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/feed')}
        >
          <div className="relative flex-shrink-0">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <PawPrint className="h-3 w-3 text-secondary absolute -bottom-0.5 -right-0.5" />
          </div>
          <span className="font-bold text-lg bg-warm-gradient bg-clip-text text-transparent hidden sm:inline truncate">
            Paw Friend
          </span>
        </div>

        {/* User Section */}
        {user && (
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-accent min-h-[44px] min-w-[44px]"
                >
                  <Bell className="h-5 w-5" />
                  {notifUnreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive hover:bg-destructive/90">
                      {notifUnreadCount > 9 ? "9+" : notifUnreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Notificaciones</h4>
                  {notifUnreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllRead()}>
                      Marcar todas como leídas
                    </Button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="font-medium">Todo al día</p>
                    <p>Sin notificaciones. 🎉</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[320px]">
                    {notifications.map((n) => {
                      const { icon: Icon, color } = getNotificationIcon(n.type);
                      return (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 p-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0 ${!n.is_read ? "bg-primary/5" : ""}`}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id);
                            if (n.action_url) navigate(n.action_url);
                          }}
                        >
                          <div className={`mt-0.5 flex-shrink-0 ${color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.is_read && (
                            <div className="mt-2 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </ScrollArea>
                )}
                <Separator />
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/settings')}>
                    Configurar notificaciones
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Messages Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-accent min-h-[44px] min-w-[44px]"
                >
                  <MessageSquare className="h-5 w-5" />
                  {msgUnreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive hover:bg-destructive/90">
                      {msgUnreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Mensajes</h4>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/chat')}>
                    Ver todos
                  </Button>
                </div>
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  {msgUnreadCount > 0
                    ? <p>Tienes {msgUnreadCount} mensaje{msgUnreadCount > 1 ? "s" : ""} sin leer</p>
                    : <p>No tienes mensajes nuevos</p>
                  }
                </div>
                <Separator />
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/chat')}>
                    Ir a mensajes
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* User avatar → Home */}
            <div
              className="flex items-center gap-2 hover:bg-accent px-1.5 sm:px-2 py-1 rounded-lg transition-colors cursor-pointer min-h-[44px]"
              onClick={() => navigate('/home')}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-warm-gradient text-white text-sm font-semibold">
                    {profile?.display_name?.[0] || user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {userStats && userStats.level > 1 && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                    <Crown className="h-3 w-3 text-yellow-900" />
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm truncate max-w-[120px]">
                    {profile?.display_name || user?.email?.split("@")[0]}
                  </span>
                  {userStats && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                      Nv.{userStats.level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
