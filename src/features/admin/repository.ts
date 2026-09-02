import type {
  AdminBook,
  AdminDashboardSummary,
  AdminReport,
  AdminTransaction,
  AdminUser,
  AuditEvent,
  PlatformSettings,
  ReportStatus,
  TransactionStatus,
  TransactionType,
  UserStatus,
} from "./types";

const adminUsers: AdminUser[] = [
  {
    id: "user-01",
    name: "Amara Diallo",
    email: "amara@somi.app",
    role: "WRITER",
    status: "ACTIVE",
    joinedAt: "2024-02-14T00:00:00.000Z",
    lastActiveAt: "2025-08-20T15:00:00.000Z",
    booksPublished: 5,
    avatar: "AD",
  },
  {
    id: "user-02",
    name: "Kwame Mensah",
    email: "kwame@somi.app",
    role: "READER",
    status: "ACTIVE",
    joinedAt: "2024-05-12T00:00:00.000Z",
    lastActiveAt: "2025-08-21T10:00:00.000Z",
    booksPublished: 0,
    avatar: "KM",
  },
  {
    id: "user-03",
    name: "Fatou Ndiaye",
    email: "fatou@somi.app",
    role: "WRITER",
    status: "PENDING",
    joinedAt: "2025-07-10T00:00:00.000Z",
    lastActiveAt: "2025-08-18T08:00:00.000Z",
    booksPublished: 1,
    avatar: "FN",
  },
  {
    id: "user-04",
    name: "Chidi Okonkwo",
    email: "chidi@somi.app",
    role: "READER",
    status: "SUSPENDED",
    joinedAt: "2024-01-18T00:00:00.000Z",
    lastActiveAt: "2025-08-17T14:00:00.000Z",
    booksPublished: 0,
    avatar: "CO",
  },
  {
    id: "user-05",
    name: "Zintle Dlamini",
    email: "zintle@somi.app",
    role: "ADMIN",
    status: "ACTIVE",
    joinedAt: "2023-11-03T00:00:00.000Z",
    lastActiveAt: "2025-08-22T12:00:00.000Z",
    booksPublished: 2,
    avatar: "ZD",
  },
];

const adminBooks: AdminBook[] = [
  {
    id: "book-01",
    title: "The Baobab Kingdom",
    writer: "Amara Diallo",
    genre: "Fantasy",
    chapters: 12,
    status: "PUBLISHED",
    moderationStatus: "APPROVED",
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2025-08-20T00:00:00.000Z",
  },
  {
    id: "book-02",
    title: "Dark River",
    writer: "Kwame Mensah",
    genre: "Thriller",
    chapters: 8,
    status: "READY_FOR_REVIEW",
    moderationStatus: "PENDING",
    createdAt: "2025-08-12T00:00:00.000Z",
    updatedAt: "2025-08-22T00:00:00.000Z",
  },
  {
    id: "book-03",
    title: "Echoes of Kongo",
    writer: "Fatou Ndiaye",
    genre: "Historical",
    chapters: 5,
    status: "REJECTED",
    moderationStatus: "REJECTED",
    createdAt: "2025-07-30T00:00:00.000Z",
    updatedAt: "2025-08-05T00:00:00.000Z",
    metadata: { reason: "Plagiarism concerns" },
  },
  {
    id: "book-04",
    title: "Night Market",
    writer: "Zintle Dlamini",
    genre: "Mystery",
    chapters: 10,
    status: "EDITING",
    moderationStatus: "CHANGES_REQUESTED",
    createdAt: "2025-08-10T00:00:00.000Z",
    updatedAt: "2025-08-19T00:00:00.000Z",
  },
];

const adminReports: AdminReport[] = [
  {
    id: "report-01",
    reporter: "Lina K",
    target: "Dark River · Ch. 4",
    targetType: "CHAPTER",
    reason: "Graphic content",
    description: "Contains explicit violence not tagged for age restrictions.",
    createdAt: "2025-08-22T09:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "report-02",
    reporter: "Peter S",
    target: "Amara Diallo",
    targetType: "USER",
    reason: "Harassment",
    description: "Repeated abusive replies in comments.",
    createdAt: "2025-08-21T18:00:00.000Z",
    status: "UNDER_REVIEW",
    assignedAdmin: "Zintle Dlamini",
  },
  {
    id: "report-03",
    reporter: "Asha T",
    target: "The Baobab Kingdom",
    targetType: "CONTENT",
    reason: "Copyright concern",
    description: "Potentially copied cover art and chapter intro.",
    createdAt: "2025-08-19T12:00:00.000Z",
    status: "RESOLVED",
    resolution: "Cover was replaced and chapter was re-reviewed.",
  },
];

const adminTransactions: AdminTransaction[] = [
  {
    id: "txn-01",
    userId: "user-02",
    user: "Kwame Mensah",
    type: "COIN_PURCHASE",
    amount: 1000,
    currency: "USD",
    coins: 1000,
    status: "COMPLETED",
    timestamp: "2025-08-22T08:00:00.000Z",
  },
  {
    id: "txn-02",
    userId: "user-01",
    user: "Amara Diallo",
    type: "CHAPTER_UNLOCK",
    amount: 120,
    currency: "USD",
    coins: 120,
    status: "PENDING",
    timestamp: "2025-08-22T09:30:00.000Z",
  },
  {
    id: "txn-03",
    userId: "user-04",
    user: "Chidi Okonkwo",
    type: "REFUND",
    amount: 75,
    currency: "USD",
    coins: 75,
    status: "FAILED",
    timestamp: "2025-08-20T12:00:00.000Z",
  },
  {
    id: "txn-04",
    userId: "user-05",
    user: "Zintle Dlamini",
    type: "ADJUSTMENT",
    amount: 250,
    currency: "USD",
    coins: 250,
    status: "COMPLETED",
    timestamp: "2025-08-19T16:45:00.000Z",
  },
];

const auditEvents: AuditEvent[] = [
  {
    id: "audit-01",
    actorId: "admin-05",
    actorName: "Zintle Dlamini",
    action: "BOOK_APPROVED",
    targetType: "BOOK",
    targetId: "book-01",
    metadata: { title: "The Baobab Kingdom" },
    timestamp: "2025-08-21T11:00:00.000Z",
  },
  {
    id: "audit-02",
    actorId: "admin-05",
    actorName: "Zintle Dlamini",
    action: "USER_SUSPENDED",
    targetType: "USER",
    targetId: "user-04",
    metadata: { reason: "Repeated abuse reports" },
    timestamp: "2025-08-20T10:15:00.000Z",
  },
  {
    id: "audit-03",
    actorId: "admin-05",
    actorName: "Zintle Dlamini",
    action: "REPORT_RESOLVED",
    targetType: "REPORT",
    targetId: "report-03",
    metadata: { resolution: "Copyright issue reviewed" },
    timestamp: "2025-08-19T15:00:00.000Z",
  },
];

const platformSettings: PlatformSettings = {
  platformName: "SOMI",
  supportEmail: "support@somi.app",
  maintenanceMode: false,
  moderationEnabled: true,
  writerRegistrationEnabled: true,
  autoPublishEnabled: false,
  coinConversionRate: 100,
  minimumPurchase: 25,
  chapterPricingRules:
    "Premium chapters must be priced between 25 and 500 coins.",
  emailNotifications: true,
  moderationNotifications: true,
  paymentNotifications: true,
  sessionPolicy: "Session refresh every 12 hours",
  adminSessionTimeoutMinutes: 120,
  suspiciousActivityMonitoring: true,
};

export interface AdminRepository {
  getDashboardSummary(): AdminDashboardSummary;
  getUsers(): AdminUser[];
  getUser(userId: string): AdminUser | undefined;
  updateUser(userId: string, next: Partial<AdminUser>): AdminUser | undefined;
  getBooks(): AdminBook[];
  getBook(bookId: string): AdminBook | undefined;
  updateBook(bookId: string, next: Partial<AdminBook>): AdminBook | undefined;
  getReports(): AdminReport[];
  updateReport(
    reportId: string,
    next: Partial<AdminReport>,
  ): AdminReport | undefined;
  getTransactions(): AdminTransaction[];
  getEconomySummary(): {
    totalCoinPurchases: number;
    totalCoinsSpent: number;
    revenue: number;
    refunds: number;
    failedPayments: number;
    pendingTransactions: number;
  };
  getAuditEvents(): AuditEvent[];
  createAuditEvent(event: Partial<AuditEvent>): AuditEvent;
  getPlatformSettings(): PlatformSettings;
  updatePlatformSettings(next: Partial<PlatformSettings>): PlatformSettings;
}

export const mockAdminRepository: AdminRepository = {
  getDashboardSummary() {
    return {
      activeReaders: 18400,
      activeWriters: 234,
      publishedBooks: 1287,
      pendingModeration: 12,
      transactionsToday: 428,
      revenueToday: 9125,
      needsAttention: [
        {
          id: "moderation-queue",
          label: "Books awaiting review",
          count: 8,
          severity: "high",
          path: "/admin/content",
        },
        {
          id: "reported-chapters",
          label: "Reported chapters",
          count: 3,
          severity: "high",
          path: "/admin/reports",
        },
        {
          id: "payment-issues",
          label: "Payment issues",
          count: 2,
          severity: "medium",
          path: "/admin/economy",
        },
        {
          id: "writer-verification",
          label: "Writers awaiting verification",
          count: 5,
          severity: "medium",
          path: "/admin/users",
        },
      ],
      activity: [
        {
          id: "act-1",
          text: "A new book was published: The Baobab Kingdom",
          time: "8m ago",
          type: "book",
        },
        {
          id: "act-2",
          text: "Three chapters were submitted for review",
          time: "24m ago",
          type: "chapter",
        },
        {
          id: "act-3",
          text: "Writer verification approved for Amara Diallo",
          time: "1h ago",
          type: "writer",
        },
        {
          id: "act-4",
          text: "Revenue payout completed for the last cycle",
          time: "2h ago",
          type: "transaction",
        },
        {
          id: "act-5",
          text: "Report resolved: copyright concern",
          time: "5h ago",
          type: "report",
        },
      ],
      contentHealth: {
        booksPublishedThisWeek: 42,
        chaptersPublishedThisWeek: 168,
        pendingSubmissions: 17,
        rejectedContent: 4,
      },
      economyHealth: {
        coinsPurchased: 280000,
        coinsSpent: 195000,
        revenue: 28150,
        refunds: 480,
        failedTransactions: 7,
      },
    };
  },
  getUsers() {
    return adminUsers;
  },
  getUser(userId) {
    return adminUsers.find((user) => user.id === userId);
  },
  updateUser(userId, next) {
    const index = adminUsers.findIndex((user) => user.id === userId);
    if (index < 0) {
      return undefined;
    }
    const existing = adminUsers[index];
    adminUsers[index] = { ...existing, ...next };
    return adminUsers[index];
  },
  getBooks() {
    return adminBooks;
  },
  getBook(bookId) {
    return adminBooks.find((book) => book.id === bookId);
  },
  updateBook(bookId, next) {
    const index = adminBooks.findIndex((book) => book.id === bookId);
    if (index < 0) {
      return undefined;
    }
    adminBooks[index] = { ...adminBooks[index], ...next };
    return adminBooks[index];
  },
  getReports() {
    return adminReports;
  },
  updateReport(reportId, next) {
    const index = adminReports.findIndex((report) => report.id === reportId);
    if (index < 0) {
      return undefined;
    }
    adminReports[index] = { ...adminReports[index], ...next };
    return adminReports[index];
  },
  getTransactions() {
    return adminTransactions;
  },
  getEconomySummary() {
    return {
      totalCoinPurchases: 320000,
      totalCoinsSpent: 218500,
      revenue: 28620,
      refunds: 840,
      failedPayments: 12,
      pendingTransactions: 4,
    };
  },
  getAuditEvents() {
    return auditEvents;
  },
  createAuditEvent(event) {
    const created = buildAuditEvent(event);
    auditEvents.unshift(created);
    return created;
  },
  getPlatformSettings() {
    return { ...platformSettings };
  },
  updatePlatformSettings(next) {
    Object.assign(platformSettings, next);
    return { ...platformSettings };
  },
};

export function filterUserList(
  users: AdminUser[],
  role?: string,
  status?: UserStatus | "ALL",
  query?: string,
): AdminUser[] {
  return users.filter((user) => {
    const text = `${user.name} ${user.email}`.toLowerCase();
    const matchesRole = !role || role === "ALL" || user.role === role;
    const matchesStatus = !status || status === "ALL" || user.status === status;
    const matchesQuery = !query || text.includes(query.toLowerCase());
    return matchesRole && matchesStatus && matchesQuery;
  });
}

export function filterBookList(
  books: AdminBook[],
  status?: string,
  moderationStatus?: string,
  query?: string,
): AdminBook[] {
  return books.filter((book) => {
    const matchesStatus = !status || status === "ALL" || book.status === status;
    const matchesModeration =
      !moderationStatus ||
      moderationStatus === "ALL" ||
      book.moderationStatus === moderationStatus;
    const matchesQuery =
      !query ||
      `${book.title} ${book.writer}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return matchesStatus && matchesModeration && matchesQuery;
  });
}

export function filterReportList(
  reports: AdminReport[],
  status?: ReportStatus | "ALL",
  targetType?: string,
): AdminReport[] {
  return reports.filter((report) => {
    const matchesStatus =
      !status || status === "ALL" || report.status === status;
    const matchesType =
      !targetType || targetType === "ALL" || report.targetType === targetType;
    return matchesStatus && matchesType;
  });
}

export function filterTransactionList(
  transactions: AdminTransaction[],
  type?: TransactionType | "ALL",
  status?: TransactionStatus | "ALL",
): AdminTransaction[] {
  return transactions.filter((transaction) => {
    const matchesType = !type || type === "ALL" || transaction.type === type;
    const matchesStatus =
      !status || status === "ALL" || transaction.status === status;
    return matchesType && matchesStatus;
  });
}
