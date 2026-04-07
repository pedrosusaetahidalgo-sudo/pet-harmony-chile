import { PlanId } from './plans';
import { isFeatureEnabled } from './featureFlags';

export function calculateBookingCommission(
  totalPrice: number,
  userPlanId: PlanId
): {
  userPays: number;
  userFee: number;
  platformFee: number;
  providerReceives: number;
} {
  // Pivot médico: app 100% gratis para usuarios.
  // Si USER_PREMIUM se reactiva en el futuro, el fee al usuario vuelve.
  const userFeePercent = isFeatureEnabled('USER_PREMIUM')
    ? (userPlanId === 'free' ? 5 : 0)
    : 0;
  const userFee = Math.round(totalPrice * userFeePercent / 100);
  const platformFee = Math.round(totalPrice * 12 / 100);

  return {
    userPays: totalPrice + userFee,
    userFee,
    platformFee,
    providerReceives: totalPrice - platformFee,
  };
}
