import { appConfig } from "../../config/env";
import { apiAuthRepository } from "./authRepository";

export type WalletState = { id?: string; balance: number; currency: string };

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  coins: number;
  status: string;
  reference?: string | null;
  createdAt: string;
};

const mockWalletRepository = {
  getWallet: () => ({ balance: 250, currency: "Somi Coins" }),
  getTransactions: () => [
    {
      id: "txn-001",
      type: "credit",
      amount: 100,
      coins: 100,
      status: "completed",
      createdAt: "Today",
    },
    {
      id: "txn-002",
      type: "unlock",
      amount: -80,
      coins: 80,
      status: "completed",
      createdAt: "Yesterday",
    },
    {
      id: "txn-003",
      type: "credit",
      amount: 50,
      coins: 50,
      status: "pending",
      createdAt: "2 days ago",
    },
  ],
};

const apiWalletRepository = {
  async getWallet(): Promise<WalletState> {
    const response = await apiAuthRepository.authorizedRequest<{
      wallet: WalletState;
    }>("/api/v1/wallet");
    return response.wallet;
  },
  async getTransactions(): Promise<WalletTransaction[]> {
    const response = await apiAuthRepository.authorizedRequest<{
      transactions: WalletTransaction[];
    }>("/api/v1/wallet/transactions");
    return response.transactions;
  },
  async getEntitlement(bookId: string, chapterId: string) {
    return apiAuthRepository.authorizedRequest<{
      entitled: boolean;
      access: string;
    }>(`/api/v1/books/${bookId}/chapters/${chapterId}/entitlement`);
  },
  async unlock(bookId: string, chapterId: string) {
    return apiAuthRepository.authorizedRequest<{
      entitled: boolean;
      alreadyUnlocked: boolean;
      balance: number;
    }>(`/api/v1/books/${bookId}/chapters/${chapterId}/unlock`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};

export const useApiEconomy = appConfig.useApiEconomy;
export const walletRepository = useApiEconomy
  ? apiWalletRepository
  : mockWalletRepository;
export { apiWalletRepository, mockWalletRepository };
