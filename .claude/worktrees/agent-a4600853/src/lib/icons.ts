/**
 * Punto único de iconos del proyecto.
 *
 * Re-exporta TODO lucide-react desde un solo módulo. Esto permite:
 *  1. Cambiar el set de iconos en el futuro sin tocar 100+ archivos.
 *  2. Auditar fácilmente qué iconos se usan.
 *  3. Migrar a otro icon set (ej: tabler-icons) cambiando solo este archivo.
 *
 * Uso directo (preferido para mantener compatibilidad con código existente):
 *   import { Stethoscope, Heart } from "@/lib/icons";
 *
 * Uso semántico (preferido para código nuevo):
 *   import { ICONS } from "@/lib/icons";
 *   <ICONS.health.vaccine className="h-4 w-4" />
 */

// Re-export wildcard: cualquier icono que exista en lucide-react se puede
// importar desde "@/lib/icons" sin tener que listarlo explícitamente.
export * from "lucide-react";

// === Mapa semántico (preferido para código nuevo) ===
import {
  Heart,
  Stethoscope,
  Syringe,
  Pill,
  Activity,
  FileText,
  Bell,
  User,
  Users,
  Building2,
  Home as HomeIcon,
  Star,
  MapPin,
  Calendar,
  BadgeCheck,
  MessageSquare,
  MessageCircle,
  Plus,
  Search,
  Filter,
  Settings,
  LogOut,
  Edit,
  Trash2,
  Save,
  Share2,
  Upload,
  Eye,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Camera,
  Image,
  Loader2,
  X,
  Crown,
  Sparkles,
  Mail,
  Phone,
  Lock,
  PawPrint,
} from "lucide-react";

export const ICONS = {
  health: {
    general: Heart,
    vet: Stethoscope,
    vaccine: Syringe,
    medication: Pill,
    activity: Activity,
    record: FileText,
    reminder: Bell,
  },
  vet: {
    individual: User,
    clinic: Building2,
    homeVisit: HomeIcon,
    rating: Star,
    location: MapPin,
    booking: Calendar,
    verified: BadgeCheck,
  },
  community: {
    chat: MessageSquare,
    message: MessageCircle,
    social: Users,
    adoption: Heart,
  },
  actions: {
    add: Plus,
    search: Search,
    filter: Filter,
    settings: Settings,
    logout: LogOut,
    edit: Edit,
    delete: Trash2,
    save: Save,
    share: Share2,
    upload: Upload,
    view: Eye,
  },
  nav: {
    back: ArrowLeft,
    forward: ArrowRight,
    prev: ChevronLeft,
    next: ChevronRight,
    expand: ChevronDown,
    external: ExternalLink,
  },
  alerts: {
    critical: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    successFilled: CheckCircle2,
    error: XCircle,
    notification: Bell,
  },
  misc: {
    camera: Camera,
    image: Image,
    loading: Loader2,
    close: X,
    crown: Crown,
    sparkles: Sparkles,
    email: Mail,
    phone: Phone,
    lock: Lock,
    paw: PawPrint,
  },
} as const;
