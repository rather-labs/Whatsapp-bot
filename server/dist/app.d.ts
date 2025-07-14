/**
 * WhatsApp Bot Backend Server
 *
 * TIMESTAMP POLICY: All timestamps are stored in UTC/ISO 8601 format
 * - Database columns use TEXT type with UTC datetime defaults
 * - All timestamp operations use new Date().toISOString()
 * - This ensures consistent timezone handling across all environments
 */
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=app.d.ts.map