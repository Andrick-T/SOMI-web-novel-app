import { AppError } from "../../common/errors/http-error.js";

export type CinetPayCheckoutRequest = {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  notifyUrl: string;
  returnUrl: string;
  channels: string;
};

export type CinetPayCheckoutResponse = {
  code: string;
  message?: string;
  data?: {
    payment_token?: string;
    payment_url?: string;
  };
};

export async function createCinetPayCheckout(
  payment: {
    somiReference: string;
    amount: number;
    currency: string;
    coins: number;
    packageId: string | null;
  },
  config: {
    apiKey: string;
    siteId: string;
    apiUrl: string;
    notifyUrl: string;
    returnUrl: string;
    channels: string;
  },
) {
  const payload: CinetPayCheckoutRequest = {
    transactionId: payment.somiReference,
    amount: payment.amount,
    currency: payment.currency,
    description: `SOMI ${payment.packageId ?? "coin purchase"} - ${payment.coins} coins`,
    notifyUrl: config.notifyUrl,
    returnUrl: config.returnUrl,
    channels: config.channels,
  };

  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SOMI-Payment-Service/1.0",
    },
    body: JSON.stringify({
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
      description: payload.description,
      notify_url: payload.notifyUrl,
      return_url: payload.returnUrl,
      channels: payload.channels,
      metadata: payment.somiReference,
    }),
  });

  if (!response.ok) {
    throw new AppError(
      502,
      "PAYMENT_PROVIDER_UNAVAILABLE",
      "Unable to initialize payment with the payment provider.",
    );
  }

  const body = (await response.json()) as CinetPayCheckoutResponse;

  if (body.code !== "201" || !body.data?.payment_url) {
    throw new AppError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      body.message ?? "The payment provider rejected the payment request.",
    );
  }

  return {
    paymentUrl: body.data.payment_url,
    paymentToken: body.data.payment_token ?? null,
  };
}


export type CinetPayVerification = {
  code: string;
  message?: string;
  data?: {
    amount?: string;
    currency?: string;
    status?: string;
    payment_method?: string;
    description?: string;
    metadata?: string | null;
    operator_id?: string | null;
    payment_date?: string;
    fund_availability_date?: string;
  };
  api_response_id?: string;
};

export async function verifyCinetPayTransaction(
  transactionId: string,
  config: { apiKey: string; siteId: string },
) {
  const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SOMI-Payment-Service/1.0",
    },
    body: JSON.stringify({
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id: transactionId,
    }),
  });

  if (!response.ok) {
    throw new AppError(
      502,
      "PAYMENT_PROVIDER_UNAVAILABLE",
      "Unable to verify the payment with the payment provider.",
    );
  }

  return (await response.json()) as CinetPayVerification;
}
