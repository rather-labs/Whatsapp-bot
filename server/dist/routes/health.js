"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const blockchain_1 = require("../config/blockchain");
const router = express_1.default.Router();
// Health check
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        network: blockchain_1.networkConfig?.name || 'unknown',
        database: 'connected',
        blockchain: 'connected'
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map