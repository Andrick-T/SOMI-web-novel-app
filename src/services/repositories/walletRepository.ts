export const walletRepository = {
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
