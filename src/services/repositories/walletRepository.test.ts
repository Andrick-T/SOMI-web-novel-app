import { afterEach, describe, expect, it, vi } from "vitest";
import { apiAuthRepository } from "./authRepository";
import { apiWalletRepository, mockWalletRepository } from "./walletRepository";

afterEach(() => vi.restoreAllMocks());

describe("API economy repository", () => {
  it("maps wallet, transactions, entitlement, and unlock responses", async () => {
    const request = vi.spyOn(apiAuthRepository, "authorizedRequest");
    request.mockResolvedValueOnce({
      wallet: { balance: 3150, currency: "SOMI" },
    });
    request.mockResolvedValueOnce({
      transactions: [{ id: "tx-1", type: "CHAPTER_UNLOCK", coins: -120 }],
    });
    request.mockResolvedValueOnce({ entitled: false, access: "LOCKED" });
    request.mockResolvedValueOnce({
      entitled: true,
      alreadyUnlocked: false,
      balance: 3030,
    });

    await expect(apiWalletRepository.getWallet()).resolves.toEqual({
      balance: 3150,
      currency: "SOMI",
    });
    await expect(apiWalletRepository.getTransactions()).resolves.toEqual([
      { id: "tx-1", type: "CHAPTER_UNLOCK", coins: -120 },
    ]);
    await expect(
      apiWalletRepository.getEntitlement("book-1", "chapter-1"),
    ).resolves.toEqual({ entitled: false, access: "LOCKED" });
    await expect(
      apiWalletRepository.unlock("book-1", "chapter-1"),
    ).resolves.toEqual({
      entitled: true,
      alreadyUnlocked: false,
      balance: 3030,
    });
    expect(request).toHaveBeenCalledWith(
      "/api/v1/books/book-1/chapters/chapter-1/unlock",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("propagates structured insufficient-balance/API failures", async () => {
    const error = Object.assign(new Error("Insufficient SOMI coin balance."), {
      code: "INSUFFICIENT_BALANCE",
    });
    vi.spyOn(apiAuthRepository, "authorizedRequest").mockRejectedValue(error);
    await expect(
      apiWalletRepository.unlock("book-1", "chapter-1"),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
  });

  it("keeps mock mode explicit and separate from the API repository", () => {
    expect(mockWalletRepository.getWallet().balance).toBe(250);
    expect(apiWalletRepository).not.toBe(mockWalletRepository);
  });
});
