import type { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        whatsappNumber: string;
        username?: string;
    };
}
declare function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export { authenticateToken, type AuthenticatedRequest };
//# sourceMappingURL=auth.d.ts.map