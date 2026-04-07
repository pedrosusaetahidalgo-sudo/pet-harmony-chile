interface CreateTransactionParams {
  amount: number;
  orderId: string;
  returnUrl: string;
  description: string;
}

interface ConfirmTransactionParams {
  token: string;
}

interface PaymentGateway {
  createTransaction(params: CreateTransactionParams): Promise<{ token: string; redirectUrl: string }>;
  confirmTransaction(params: ConfirmTransactionParams): Promise<{
    success: boolean;
    authorizationCode?: string;
    transactionDate?: string;
    amount?: number;
    responseCode?: number;
  }>;
}

class SimulatedGateway implements PaymentGateway {
  async createTransaction(params: CreateTransactionParams) {
    const token = `sim_${crypto.randomUUID().slice(0, 8)}`;
    return {
      token,
      redirectUrl: `${params.returnUrl}?token=${token}&payment_id=${params.orderId}`,
    };
  }

  async confirmTransaction(_params: ConfirmTransactionParams) {
    // Simulate: 95% success, 5% failure
    const success = Math.random() > 0.05;
    return {
      success,
      authorizationCode: success ? `AUTH${Date.now()}` : undefined,
      transactionDate: new Date().toISOString(),
      amount: 0,
      responseCode: success ? 0 : -1,
    };
  }
}

export function getPaymentGateway(): PaymentGateway {
  return new SimulatedGateway();
}
