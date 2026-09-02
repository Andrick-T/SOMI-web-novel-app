import { describe, expect, it } from "vitest";
import {
  canAffordChapter,
  coinPackageCatalog,
  createWallet,
  getCoinsFromCfa,
  unlockChapterEntitlement,
} from "./service";

describe("economy service", () => {
  it("calculates the documented conversion rate", () => {
    expect(getCoinsFromCfa(175)).toBe(3150);
    expect(getCoinsFromCfa(425)).toBe(8000);
    expect(getCoinsFromCfa(850)).toBe(17000);
  });

  it("requires a minimum purchase value", () => {
    const packageChoice = coinPackageCatalog.find(
      (pkg) => pkg.amountCfa === 100,
    );
    expect(packageChoice?.amountCfa).toBeGreaterThanOrEqual(100);
    expect(coinPackageCatalog.some((pkg) => pkg.amountCfa < 100)).toBe(false);
  });

  it("prevents unlocking a chapter without funds", () => {
    const wallet = createWallet({ userId: "u-1", balance: 50 });
    expect(canAffordChapter(wallet.balance, 80)).toBe(false);
  });

  it("allows a valid unlock and prevents duplicate charges", () => {
    const wallet = createWallet({ userId: "u-1", balance: 200 });
    const result = unlockChapterEntitlement({
      userId: "u-1",
      bookId: "bk",
      chapterId: "bk-c4",
      priceCoins: 80,
      wallet,
      existingEntitlements: [],
    });

    expect(result.success).toBe(true);
    expect(result.wallet.balance).toBe(120);
    expect(result.transaction.type).toBe("CHAPTER_UNLOCK");

    const duplicate = unlockChapterEntitlement({
      userId: "u-1",
      bookId: "bk",
      chapterId: "bk-c4",
      priceCoins: 80,
      wallet: result.wallet,
      existingEntitlements: result.entitlements,
    });

    expect(duplicate.success).toBe(false);
    expect(duplicate.reason).toBe("duplicate");
  });
});
