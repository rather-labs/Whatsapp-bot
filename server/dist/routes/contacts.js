"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Add a contact
router.post('/', auth_1.authenticateToken, (req, res) => {
    const { name, contact_userid } = req.body;
    if (!name || !contact_userid) {
        return res.status(400).json({ error: 'Name and contact_userid are required' });
    }
    const contactId = (0, uuid_1.v4)();
    database_1.default.run('INSERT INTO contacts (id, user_whatsapp_number, name, contact_userid) VALUES (?, ?, ?, ?)', [contactId, req.user?.whatsappNumber, name, contact_userid], (err) => {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ error: 'Contact already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({
            message: 'Contact added successfully',
            contactId: contactId,
            name: name,
            contact_userid: contact_userid
        });
    });
});
// Get all contacts for a user
router.get('/', auth_1.authenticateToken, (req, res) => {
    database_1.default.all('SELECT id, name, contact_userid, created_at FROM contacts WHERE user_whatsapp_number = ? ORDER BY name', [req.user?.whatsappNumber], (err, contacts) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(contacts);
    });
});
// Get a specific contact
router.get('/:contactId', auth_1.authenticateToken, (req, res) => {
    const { contactId } = req.params;
    database_1.default.get('SELECT id, name, contact_userid, created_at FROM contacts WHERE id = ? AND user_whatsapp_number = ?', [contactId, req.user?.whatsappNumber], (err, contact) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    });
});
// Update a contact
router.put('/:contactId', auth_1.authenticateToken, (req, res) => {
    const { contactId } = req.params;
    const { name, contact_userid } = req.body;
    if (!name || !contact_userid) {
        return res.status(400).json({ error: 'Name and contact_userid are required' });
    }
    database_1.default.run('UPDATE contacts SET name = ?, contact_userid = ? WHERE id = ? AND user_whatsapp_number = ?', [name, contact_userid, contactId, req.user?.whatsappNumber], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json({
            message: 'Contact updated successfully',
            contactId: contactId,
            name: name,
            contact_userid: contact_userid
        });
    });
});
// Delete a contact
router.delete('/:contactId', auth_1.authenticateToken, (req, res) => {
    const { contactId } = req.params;
    database_1.default.run('DELETE FROM contacts WHERE id = ? AND user_whatsapp_number = ?', [contactId, req.user?.whatsappNumber], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json({
            message: 'Contact deleted successfully',
            contactId: contactId
        });
    });
});
exports.default = router;
//# sourceMappingURL=contacts.js.map