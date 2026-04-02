import { PlanId } from './plans';

export function calculateBookingCommission(
  totalPrice: number,
  userPlanId: PlanId
): {
  userPays: number;
  userFee: number;
  platformFee: number;
  providerReceives: number;
} {
  const userFeePercent = userPlanId === 'free' ? 5 : 0;
  const userFee = Math.round(totalPrice * userFeePercent / 100);
  const platformFee = Math.round(totalPrice * 12 / 100);

  return {
    userPays: totalPrice + userFee,
    userFee,
    platformFee,
    providerReceives: totalPrice - platformFee,
  };
}
