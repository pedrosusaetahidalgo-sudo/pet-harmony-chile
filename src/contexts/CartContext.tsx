import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  service_type: 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer';
  provider_id: string;
  provider_name?: string;
  provider_avatar?: string;
  pet_ids: string[];
  pet_names?: string[];
  scheduled_date: string;
  duration_minutes: number;
  service_details?: Record<string, any>;
  unit_price_clp: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  special_instructions?: string;
}

interface PlatformFeeConfig {
  percentage: number;
  min_fee_clp: number;
  max_fee_clp: number;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => Promise<void>;
  clearCart: () => Promise<void>;
  getSubtotal: () => number;
  getPlatformFee: () => number;
  getTotal: () => number;
  feeConfig: PlatformFeeConfig | null;
  isPremium: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [feeConfig, setFeeConfig] = useState<PlatformFeeConfig | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Load cart items and fee config when user logs in
  useEffect(() => {
    if (user) {
      loadCartItems();
      loadFeeConfig();
      loadPremiumStatus();
    } else {
      setItems([]);
      setIsPremium(false);
    }
  }, [user]);

  const loadFeeConfig = async () => {
    const { data, error } = await supabase
      .from('platform_config')
      .select('config_value')
      .eq('config_key', 'platform_fee')
      .maybeSingle();
    
    if (data && !error) {
      setFeeConfig(data.config_value as unknown as PlatformFeeConfig);
    }
  };

  const loadPremiumStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, premium_end_date')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data && !error) {
      // Check if premium is still active
      const isActive = data.is_premium && 
        (!data.premium_end_date || new Date(data.premium_end_date) > new Date());
      setIsPremium(isActive);
    }
  };

  const loadCartItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enrich cart items with provider and pet info
      const enrichedItems = await Promise.all((data || []).map(async (item) => {
        // Get provider info based on service type
        let providerName = 'Proveedor';
        let providerAvatar = '';
        
        const profileTable = getProfileTable(item.service_type);
        if (profileTable) {
          const { data: profile } = await supabase
            .from(profileTable)
            .select('user_id')
            .eq('user_id', item.provider_id)
            .maybeSingle();
          
          if (profile) {
            const { data: profileInfo } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('id', item.provider_id)
              .maybeSingle();
            
            if (profileInfo) {
              providerName = profileInfo.display_name || 'Proveedor';
              providerAvatar = profileInfo.avatar_url || '';
            }
          }
        }

        // Get pet names
        const { data: pets } = await supabase
          .from('pets')
          .select('name')
          .in('id', item.pet_ids);
        
        const petNames = pets?.map(p => p.name) || [];

        return {
          ...item,
          provider_name: providerName,
          provider_avatar: providerAvatar,
          pet_names: petNames,
        } as CartItem;
      }));

      setItems(enrichedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileTable = (serviceType: string) => {
    switch (serviceType) {
      case 'dog_walker': return 'dog_walker_profiles';
      case 'dogsitter': return 'dogsitter_profiles';
      case 'veterinarian': return 'vet_profiles';
      case 'trainer': return 'trainer_profiles';
      default: return null;
    }
  };

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar servicios al carrito",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          service_type: item.service_type,
          provider_id: item.provider_id,
          pet_ids: item.pet_ids,
          scheduled_date: item.scheduled_date,
          duration_minutes: item.duration_minutes,
          service_details: item.service_details,
          unit_price_clp: item.unit_price_clp,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          special_instructions: item.special_instructions,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      await loadCartItems();
      setIsCartOpen(true);
      
      toast({
        title: "Agregado al carrito",
        description: "El servicio se agregó correctamente",
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar al carrito",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Eliminado",
        description: "El servicio se eliminó del carrito",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, updates: Partial<CartItem>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;
      
      await loadCartItems();
    } catch (error) {
      console.error('Error updating cart item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + item.unit_price_clp, 0);
  };

  const getPlatformFee = () => {
    if (!feeConfig) return 0;
    
    const subtotal = getSubtotal();
    let fee = Math.round(subtotal * feeConfig.percentage / 100);
    
    if (fee < feeConfig.min_fee_clp) fee = feeConfig.min_fee_clp;
    if (fee > feeConfig.max_fee_clp) fee = feeConfig.max_fee_clp;
    
    // Apply 5% premium discount if user is premium
    if (isPremium) {
      fee = Math.round(fee * 0.95); // 5% discount
    }
    
    return fee;
  };

  const getTotal = () => {
    return getSubtotal() + getPlatformFee();
  };

  return (
    <CartContext.Provider value={{
      items,
      isLoading,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      getSubtotal,
      getPlatformFee,
      getTotal,
      feeConfig,
      isPremium,
    }}>
      {children}
    </CartContext.Provider>
  );
};
