import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Dog, FileCheck, Megaphone, Settings, Briefcase, Megaphone as AdIcon } from "lucide-react";
import AdminProviders from "@/components/admin/AdminProviders";
import AdminServiceProviders from "@/components/admin/AdminServiceProviders";
import AdminVerificationRequests from "@/components/admin/AdminVerificationRequests";
import AdminServicePromotions from "@/components/admin/AdminServicePromotions";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminSettings from "@/components/admin/AdminSettings";
import AdManagement from "@/components/admin/AdManagement";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("service-providers");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona proveedores, usuarios y contenido</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2 h-auto p-2">
          <TabsTrigger value="service-providers" className="flex items-center gap-2 py-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Central</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2 py-2">
            <Dog className="h-4 w-4" />
            <span className="hidden sm:inline">Legacy</span>
          </TabsTrigger>
          <TabsTrigger value="verifications" className="flex items-center gap-2 py-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Verificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2 py-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Promociones</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center gap-2 py-2">
            <AdIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Anuncios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="service-providers">
          <AdminServiceProviders />
        </TabsContent>

        <TabsContent value="providers">
          <AdminProviders />
        </TabsContent>

        <TabsContent value="verifications">
          <AdminVerificationRequests />
        </TabsContent>

        <TabsContent value="promotions">
          <AdminServicePromotions />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>

        <TabsContent value="ads">
          <AdManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
