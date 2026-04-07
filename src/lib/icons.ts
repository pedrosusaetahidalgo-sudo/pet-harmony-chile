/**
 * Punto único de iconos del proyecto.
 *
 * Toda la app debe importar iconos desde acá para garantizar consistencia
 * (ej: el icono de "vacuna" es el mismo en todas las pantallas).
 *
 * Se importan en grupos semánticos para que sea fácil encontrar el correcto.
 *
 * Uso:
 *   import { ICONS } from "@/lib/icons";
 *   <ICONS.health.vet className="h-4 w-4" />
 *
 * O importar directo si se prefiere:
 *   import { Stethoscope } from "@/lib/icons";
 */

import {
  // SALUD
  Heart,
  Stethoscope,
  Syringe,
  Pill,
  Activity,
  FileText,
  ClipboardList,
  HeartPulse,

  // VETS
  User,
  Users,
  Star,
  MapPin,
  Calendar,
  BadgeCheck,
  Building2,
  Home as HomeIcon,

  // COMUNIDAD
  MessageCircle,
  MessageSquare,
  Users2,

  // ACCIONES
  Plus,
  Search,
  Filter,
  Settings,
  LogOut,
  Edit,
  Trash2,
  Save,
  Share2,
  Download,
  Upload,
  Eye,

  // NAVEGACIÓN
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,

  // ALERTAS
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Info,
  XCircle,
  Bell,

  // OTROS
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

export {
  Heart, Stethoscope, Syringe, Pill, Activity, FileText, ClipboardList, HeartPulse,
  User, Users, Star, MapPin, Calendar, BadgeCheck, Building2, HomeIcon,
  MessageCircle, MessageSquare, Users2,
  Plus, Search, Filter, Settings, LogOut, Edit, Trash2, Save, Share2, Download, Upload, Eye,
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, ExternalLink,
  AlertCircle, AlertTriangle, CheckCircle, CheckCircle2, Info, XCircle, Bell,
  Camera, Image, Loader2, X, Crown, Sparkles, Mail, Phone, Lock, PawPrint,
};

/** Mapa semántico de iconos por contexto. */
export const ICONS = {
  health: {
    general: Heart,
    vet: Stethoscope,
    vaccine: Syringe,
    medication: Pill,
    activity: Activity,
    record: FileText,
    clinical: ClipboardList,
    pulse: HeartPulse,
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
    social: Users2,
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
    download: Download,
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
    info: Info,
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
