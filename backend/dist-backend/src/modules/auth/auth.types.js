export const ADMIN_PERMISSIONS = [
    "ADMIN_DASHBOARD_VIEW", "USER_VIEW", "USER_EDIT", "USER_SUSPEND", "WRITER_VIEW",
    "WRITER_MANAGE", "CONTENT_VIEW", "CONTENT_REVIEW", "CONTENT_APPROVE", "CONTENT_REJECT",
    "CONTENT_UNPUBLISH", "REPORT_VIEW", "REPORT_RESOLVE", "ECONOMY_VIEW", "ECONOMY_MANAGE",
    "TRANSACTION_VIEW", "SETTINGS_VIEW", "SETTINGS_MANAGE", "AUDIT_VIEW",
];
export const permissionsFor = (role) => role.toUpperCase() === "ADMIN" ? [...ADMIN_PERMISSIONS] : [];
export const hasPermission = (role, permission) => permissionsFor(role).includes(permission);
