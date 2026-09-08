export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "FINANCE_ADMIN";

export type AdminPermission =
  | "ADMIN_DASHBOARD_VIEW"
  | "USER_VIEW"
  | "USER_EDIT"
  | "USER_SUSPEND"
  | "WRITER_VIEW"
  | "WRITER_MANAGE"
  | "CONTENT_VIEW"
  | "CONTENT_REVIEW"
  | "CONTENT_APPROVE"
  | "CONTENT_REJECT"
  | "CONTENT_UNPUBLISH"
  | "REPORT_VIEW"
  | "REPORT_RESOLVE"
  | "ECONOMY_VIEW"
  | "ECONOMY_MANAGE"
  | "TRANSACTION_VIEW"
  | "SETTINGS_VIEW"
  | "SETTINGS_MANAGE"
  | "AUDIT_VIEW"
  | "users.read"
  | "users.manage"
  | "content.read"
  | "content.moderate"
  | "content.publish"
  | "content.unpublish"
  | "economy.read"
  | "economy.manage"
  | "transactions.read"
  | "reports.read"
  | "reports.resolve"
  | "audit.read"
  | "settings.read"
  | "settings.manage";

export type AdminUserRole = "READER" | "WRITER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING";
export type ModerationStatus =
  | "DRAFT"
  | "EDITING"
  | "PROOFREADING"
  | "READY_FOR_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "REJECTED"
  | "UNPUBLISHED"
  | "ARCHIVED";

export type ReportStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
export type ReportPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";
export type TransactionType =
  | "COIN_PURCHASE"
  | "CHAPTER_UNLOCK"
  | "REFUND"
  | "ADJUSTMENT";
export type AuditAction =
  | "USER_SUSPENDED"
  | "USER_REACTIVATED"
  | "USER_BANNED"
  | "ROLE_CHANGED"
  | "BOOK_APPROVED"
  | "BOOK_REJECTED"
  | "BOOK_UNPUBLISHED"
  | "REPORT_RESOLVED"
  | "REPORT_DISMISSED"
  | "WALLET_ADJUSTED"
  | "SETTING_CHANGED";

export interface ValidationError {
  field: string;
  message: string;
}

export interface AdminUser {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  role: AdminUserRole;
  status: UserStatus;
  createdAt: string;
  joinedAt?: string;
  lastActiveAt: string;
  booksPublished: number;
  booksCount?: number;
  reportsCount?: number;
  avatar: string;
  metadata?: Record<string, unknown>;
}

export interface AdminBook {
  id: string;
  title: string;
  writer: string;
  writerId?: string;
  genre: string;
  chapters: number;
  status: ModerationStatus;
  moderationStatus:
    | ModerationStatus
    | "PENDING"
    | "APPROVED"
    | "CHANGES_REQUESTED";
  priority?: ReportPriority;
  reported?: boolean;
  reportsCount?: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  cover?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminReport {
  id: string;
  reporterId?: string;
  reporter: string;
  targetId?: string;
  target: string;
  targetType: "CONTENT" | "USER" | "CHAPTER";
  reason: string;
  description: string;
  createdAt: string;
  status: ReportStatus;
  priority?: ReportPriority;
  assignedAdmin?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface AdminTransaction {
  id: string;
  userId: string;
  user: string;
  type: TransactionType;
  amount: number;
  currency: string;
  coins: number;
  status: TransactionStatus;
  timestamp: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface PlatformSettings {
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
  needsAttention: Array<{
    id: string;
    label: string;
    count: number;
    severity: "low" | "medium" | "high";
    path: string;
  }>;
  activity: Array<{ id: string; text: string; time: string; type: string }>;
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

export interface UserFilters {
  query?: string;
  role?: AdminUserRole | "ALL";
  status?: UserStatus | "ALL";
  limit?: number;
  offset?: number;
}

export interface ContentFilters {
  query?: string;
  status?: ModerationStatus | "ALL";
  moderationStatus?:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CHANGES_REQUESTED"
    | "ALL";
  genre?: string;
  writer?: string;
}

export interface ReportFilters {
  status?: ReportStatus | "ALL";
  targetType?: "CONTENT" | "USER" | "CHAPTER" | "ALL";
}

export interface TransactionFilters {
  type?: TransactionType | "ALL";
  status?: TransactionStatus | "ALL";
  userId?: string;
}

export interface AuditFilters {
  action?: AuditAction | "ALL";
  targetType?: string;
}

export interface AdminValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
