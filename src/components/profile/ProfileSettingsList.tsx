import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User,
  CreditCard,
  Link2,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Stethoscope,
  Heart,
  ChevronRight,
  ShieldCheck,
} from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useResearchConsent } from '@/hooks/useResearchConsent';
import { LINKS } from '@/lib/links';
import { ResearchConsentDialog } from '@/components/profile/ResearchConsentDialog';

interface ProfileSettingsListProps {
  onEditProfile: () => void;
  onOpenIntegrations: () => void;
  onOpenNotifications: () => void;
  isPremium?: boolean;
}

interface SettingRow {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  show?: boolean;
  variant?: 'default' | 'destructive';
  iconColor?: string;
}

export function ProfileSettingsList({
  onEditProfile,
  onOpenIntegrations,
  onOpenNotifications,
  isPremium,
}: ProfileSettingsListProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isProvider } = useActiveRole();
  const { consent } = useResearchConsent();
  const [researchDialogOpen, setResearchDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const rows: SettingRow[] = [
    {
      icon: User,
      label: 'Editar mi perfil',
      onClick: onEditProfile,
    },
    {
      icon: CreditCard,
      label: isPremium ? 'Mi membresía Paw Member' : 'Ser Paw Member 💛',
      onClick: () => navigate('/paw-member'),
    },
    {
      icon: Link2,
      label: 'Integraciones',
      onClick: onOpenIntegrations,
    },
    {
      icon: Bell,
      label: 'Notificaciones',
      onClick: onOpenNotifications,
    },
    {
      icon: Shield,
      label: 'Privacidad y legal',
      onClick: () => navigate(LINKS.privacy()),
    },
    {
      icon: ShieldCheck,
      label:
        consent === true
          ? 'Datos para investigacion: ON 💚'
          : consent === false
            ? 'Datos para investigacion: OFF'
            : 'Datos para investigacion',
      onClick: () => setResearchDialogOpen(true),
      iconColor: consent === true ? 'text-emerald-600' : 'text-muted-foreground',
    },
    {
      icon: Stethoscope,
      label: 'Modo Profesional',
      onClick: () => navigate(LINKS.providerDashboard()),
      show: isProvider,
      iconColor: 'text-purple-600',
    },
    {
      icon: Heart,
      label: 'Registro de despedida',
      onClick: () => navigate('/en-memoria'),
      iconColor: 'text-purple-500',
    },
    {
      icon: HelpCircle,
      label: 'Ayuda y soporte',
      onClick: () => navigate(LINKS.terms()),
    },
  ];

  const visibleRows = rows.filter((r) => r.show !== false);

  return (
    <>
      <ResearchConsentDialog open={researchDialogOpen} onOpenChange={setResearchDialogOpen} />
      <Card>
        <CardContent className="p-0">
          <p className="text-sm font-semibold text-muted-foreground px-4 pt-4 pb-2">
            Ajustes y cuenta
          </p>
          {visibleRows.map((row, i) => (
            <div key={row.label}>
              <button
                onClick={row.onClick}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <row.icon className={`h-4 w-4 ${row.iconColor || 'text-muted-foreground'}`} />
                  <span className="text-sm">{row.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              {i < visibleRows.length - 1 && <Separator className="mx-4" />}
            </div>
          ))}

          <Separator />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-destructive/5 transition-colors text-left"
          >
            <LogOut className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">Cerrar sesión</span>
          </button>
        </CardContent>
      </Card>
    </>
  );
}
