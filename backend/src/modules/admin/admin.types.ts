export type AdminUserRole = "READER" | "WRITER" | "ADMIN";

export type AdminUserStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING";

export type AdminModerationStatus =
  | "DRAFT"
  | "EDITING"
  | "PROOFREADING"
  | "READY_FOR_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "REJECTED"
  | "UNPUBLISHED"
  | "ARCHIVED"
  | "PENDING"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type DashboardSeverity = "low" | "medium" | "high";

export interface AdminUserSummary {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
  joinedAt: string;
  lastActiveAt: string;
  booksPublished: number;
  avatar: string | null;
  metadata: {
    username: string;
    totalBooks: number;
    libraryCount: number;
    readingProgressCount: number;
    transactionCount: number;
  };
}

export interface AdminBookSummary {
  id: string;
  title: string;
  writer: string;
  writerId: string;
  genre: string;
  chapters: number;
  status: string;
  moderationStatus: AdminModerationStatus;
  priority: string | null;
  reported: boolean;
  reportsCount: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  cover: string | null;
  metadata: {
    slug: string;
    synopsis: string | null;
    tags: string[];
    genres: string[];
    submissionStatus: string | null;
    lastReviewReason: string | null;
  };
}

export interface DashboardIssue {
  id: string;
  label: string;
  count: number;
  severity: DashboardSeverity;
  path: string;
}

export interface DashboardActivityItem {
  id: string;
  text: string;
  time: string;
  type: string;
}

export interface AdminDashboardSummary {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalWriters: number;
  books: number;
  publishedBooks: number;
  pendingReviews: number;
  reportedContent: number;
  revenue: number;
  coinsPurchased: number;
  coinsSpent: number;
  pendingTransactions: number;
  activeReaders: number;
  activeWriters: number;
  pendingModeration: number;
  transactionsToday: number;
  revenueToday: number;
  needsAttention: DashboardIssue[];
  activity: DashboardActivityItem[];
  contentHealth: {
    booksPublishedThisWeek: number;
    chaptersPublishedThisWeek: number;
    pendingSubmissions: number;
    rejectedContent: number;
  };
  economyHealth: {
    coinsPurchased: number;
    coinsSpent: number;
    revenue: number;
    refunds: number;
    failedTransactions: number;
  };
}

export interface AdminWriterSummary {
  id: string;
  name: string;
  email: string;
  status: string;
  joinedAt: string;
  lastActiveAt: string;
  totalBooks: number;
  publishedBooks: number;
  submittedBooks: number;
  pendingSubmissions: number;
  publishedChapters: number;
  totalEarnings: number;
  avatar: string | null;
}

export interface AdminUsersResponse {
  items: AdminUserSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminBooksResponse {
  items: AdminBookSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminWritersResponse {
  items: AdminWriterSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminEconomySummary {
  totalCoinPurchases: number;
  totalCoinsSpent: number;
  revenue: number;
  refunds: number;
  failedPayments: number;
  pendingTransactions: number;
  totalWalletBalance: number;
  totalWriterEarnings: number;
}

export interface AdminTransactionSummary {
  id: string;
  userId: string;
  user: string;
  type: string;
  amount: number;
  currency: string;
  coins: number;
  status: string;
  timestamp: string;
}

export interface AdminTransactionsResponse {
  items: AdminTransactionSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Administrative audit event exposed to the admin UI.
 *
 * `action` intentionally remains a string because AuditEvent.action
 * is a free-form Prisma String field and new administrative actions
 * may be introduced without requiring a frontend/backend type release.
 */
export interface AdminAuditEvent {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface AdminAuditResponse {
  items: AdminAuditEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminPlatformSettings {
  id: string;
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  moderationEnabled: boolean;
  writerRegistrationEnabled: boolean;
  autoPublishEnabled: boolean;
  coinConversionRate: number;
  minimumPurchase: number;
  chapterPricingRules: string;
  emailNotifications: boolean;
  moderationNotifications: boolean;
  paymentNotifications: boolean;
  sessionPolicy: string;
  adminSessionTimeoutMinutes: number;
  suspiciousActivityMonitoring: boolean;
  createdAt: string;
  updatedAt: string;
}


export type AdminWithdrawalStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AdminWithdrawalSummary {
  id: string;
  writerId: string;
  status: AdminWithdrawalStatus;
  coins: number;
  amountCfa: number;
  currency: string;
  exchangeRateCfa: number;
  amount: number;
  payoutMethod: string;
  payoutAccount: string;
  payoutAccountName: string | null;
  failureCount: number;
  failureMessage: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
