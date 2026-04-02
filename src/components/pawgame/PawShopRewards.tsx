import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Gift, 
  ShoppingBag, 
  Percent, 
  Heart, 
  Sparkles,
  Crown,
  Dog,
  Stethoscope,
  Home,
  Star,
  Check,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShopReward {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points_cost: number;
  discount_percentage: number | null;
  service_type: string | null;
  partner_name: string | null;
  icon: string | null;
  stock: number | null;
  is_active: boolean;
}

interface PawShopRewardsProps {
  userPoints: number;
  userId: string;
  onPurchase: () => void;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    'discount': Percent,
    'donation': Heart,
    'cosmetic': Sparkles,
    'premium': Crown,
    'service': Dog,
  };
  return icons[category] || Gift;
};

const getServiceIcon = (serviceType: string | null) => {
  if (!serviceType) return Gift;
  const icons: Record<string, any> = {
    'walker': Dog,
    'sitter': Home,
    'vet': Stethoscope,
    'trainer': Star,
  };
  return icons[serviceType] || Gift;
};

const categories = [
  { key: 'all', label: 'Todos', icon: ShoppingBag },
  { key: 'discount', label: 'Descuentos', icon: Percent },
  { key: 'donation', label: 'Donaciones', icon: Heart },
  { key: 'cosmetic', label: 'Cosméticos', icon: Sparkles },
  { key: 'premium', label: 'Premium', icon: Crown },
];

export const PawShopRewards = ({ userPoints, userId, onPurchase }: PawShopRewardsProps) => {
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const { data } = await supabase
        .from('paw_shop_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (reward: ShopReward) => {
    if (userPoints < reward.points_cost) {
      toast.error("PawPoints insuficientes", {
        description: `Necesitas ${reward.points_cost - userPoints} puntos más`
      });
      return;
    }

    if (reward.stock !== null && reward.stock <= 0) {
      toast.error("Agotado", {
        description: "Este premio ya no está disponible"
      });
      return;
    }

    try {
      setPurchasing(reward.id);

      // Deduct points first using paw_point_transactions
      const { error: pointsError } = await supabase
        .from('paw_point_transactions')
        .insert({
          user_id: userId,
          points_amount: -reward.points_cost,
          transaction_type: 'spend',
          source_type: 'reward',
          source_id: reward.id,
          description: `Canje: ${reward.name}`
        });

      if (pointsError) throw pointsError;

      toast.success("¡Premio canjeado! 🎉", {
        description: reward.category === 'donation' 
          ? "Tu donación ayudará a refugios aliados"
          : "Revisa tu email para más detalles"
      });

      onPurchase();
      loadRewards();

    } catch (error) {
      console.error('Error purchasing reward:', error);
      toast.error("Error al canjear", {
        description: "Intenta de nuevo más tarde"
      });
    } finally {
      setPurchasing(null);
    }
  };

  const renderRewardCard = (reward: ShopReward) => {
    const Icon = reward.service_type ? getServiceIcon(reward.service_type) : getCategoryIcon(reward.category);
    const canAfford = userPoints >= reward.points_cost;
    const isOutOfStock = reward.stock !== null && reward.stock <= 0;
    const isPurchasing = purchasing === reward.id;

    return (
      <Card 
        key={reward.id} 
        className={`relative overflow-hidden transition-all hover:shadow-lg ${!canAfford || isOutOfStock ? 'opacity-70' : ''}`}
      >
        {reward.discount_percentage && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-500 text-white">
              -{reward.discount_percentage}%
            </Badge>
          </div>
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Badge variant="secondary" className="text-lg">Agotado</Badge>
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
              reward.category === 'donation' ? 'from-pink-500 to-rose-500' :
              reward.category === 'premium' ? 'from-yellow-500 to-amber-500' :
              reward.category === 'cosmetic' ? 'from-purple-500 to-pink-500' :
              'from-blue-500 to-cyan-500'
            } flex items-center justify-center mb-3 shadow-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            
            <h4 className="font-semibold mb-1">{reward.name}</h4>
            {reward.partner_name && (
              <p className="text-[10px] text-muted-foreground mb-1">
                por {reward.partner_name}
              </p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {reward.description}
            </p>
            
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-lg">{reward.points_cost.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
              
              {reward.stock !== null && reward.stock > 0 && reward.stock <= 10 && (
                <p className="text-[10px] text-orange-500 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Quedan {reward.stock}
                </p>
              )}
              
              <Button 
                className="w-full"
                size="sm"
                disabled={!canAfford || isOutOfStock || isPurchasing}
                onClick={() => handlePurchase(reward)}
              >
                {isPurchasing ? (
                  "Procesando..."
                ) : canAfford ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Canjear
                  </>
                ) : (
                  `Faltan ${(reward.points_cost - userPoints).toLocaleString()} pts`
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <Card className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 border-2 border-purple-500/30">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-500 animate-pulse" />
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ¡Nuevas Funciones y Recompensas Próximamente!
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estamos trabajando en emocionantes nuevas características y recompensas para la tienda. 
            Pronto podrás canjear tus PawPoints por descuentos exclusivos, premios especiales y mucho más.
          </p>
        </CardContent>
      </Card>

      {/* Points Balance */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-purple-500" />
                Tienda de Recompensas
              </h3>
              <p className="text-sm text-muted-foreground">
                Canjea tus PawPoints por premios increíbles
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-600">{userPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">PawPoints disponibles</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-2 rounded-xl">
          {categories.map((cat) => (
            <TabsTrigger 
              key={cat.key}
              value={cat.key}
              className="flex-1 min-w-[70px] text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <cat.icon className="h-3 w-3 mr-1" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Cargando premios...</p>
            </div>
          ) : rewards.length === 0 ? (
            <Card className="text-center p-8">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay premios disponibles</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rewards.map(renderRewardCard)}
            </div>
          )}
        </TabsContent>

        {categories.slice(1).map((cat) => (
          <TabsContent key={cat.key} value={cat.key} className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rewards.filter(r => r.category === cat.key).map(renderRewardCard)}
            </div>
            {rewards.filter(r => r.category === cat.key).length === 0 && (
              <Card className="text-center p-8">
                <cat.icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay premios en esta categoría</p>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
