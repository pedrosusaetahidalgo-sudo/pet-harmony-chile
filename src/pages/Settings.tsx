import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  FileText, 
  Shield, 
  Mail, 
  Info,
  ExternalLink,
  Bell,
  Lock,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const legalItems = [
    {
      icon: FileText,
      title: "Términos y Condiciones",
      description: "Lee nuestros términos de uso",
      action: () => navigate("/terms"),
    },
    {
      icon: Shield,
      title: "Política de Privacidad",
      description: "Cómo protegemos tus datos",
      action: () => navigate("/privacy"),
    },
  ];

  const supportItems = [
    {
      icon: Mail,
      title: "Contacto",
      description: "soporte@pawfriend.cl",
      action: () => window.open("mailto:soporte@pawfriend.cl", "_blank"),
    },
    {
      icon: HelpCircle,
      title: "Centro de Ayuda",
      description: "Preguntas frecuentes",
      action: () => {},
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Configuración</h1>
        </div>

        {/* Account Info */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Conectado como: <span className="font-medium text-foreground">{user.email}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Legal Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {legalItems.map((item, index) => (
              <div key={item.title}>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-3"
                  onClick={item.action}
                >
                  <item.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div className="text-left flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>
                {index < legalItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Soporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {supportItems.map((item, index) => (
              <div key={item.title}>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-3"
                  onClick={item.action}
                  disabled={item.disabled}
                >
                  <item.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div className="text-left flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {!item.disabled && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                </Button>
                {index < supportItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Acerca de
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Versión</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Build</span>
              <span className="font-medium">1</span>
            </div>
            <Separator />
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Paw Friend © {new Date().getFullYear()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Red Social para Mascotas en Chile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
