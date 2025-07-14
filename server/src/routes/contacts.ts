import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Add a contact
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, contact_userid } = req.body;

  if (!name || !contact_userid) {
    return res.status(400).json({ error: 'Name and contact_userid are required' });
  }

  const contactId = uuidv4();
  
  db.run(
    'INSERT INTO contacts (id, user_whatsapp_number, name, contact_userid) VALUES (?, ?, ?, ?)',
    [contactId, req.user?.whatsappNumber, name, contact_userid],
    (err: any) => {
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
    }
  );
});

// Get all contacts for a user
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  db.all(
    'SELECT id, name, contact_userid, created_at FROM contacts WHERE user_whatsapp_number = ? ORDER BY name',
    [req.user?.whatsappNumber],
    (err: any, contacts: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(contacts);
    }
  );
});

// Get a specific contact
router.get('/:contactId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { contactId } = req.params;
  
  db.get(
    'SELECT id, name, contact_userid, created_at FROM contacts WHERE id = ? AND user_whatsapp_number = ?',
    [contactId, req.user?.whatsappNumber],
    (err: any, contact: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json(contact);
    }
  );
});

// Update a contact
router.put('/:contactId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { contactId } = req.params;
  const { name, contact_userid } = req.body;

  if (!name || !contact_userid) {
    return res.status(400).json({ error: 'Name and contact_userid are required' });
  }

  db.run(
    'UPDATE contacts SET name = ?, contact_userid = ? WHERE id = ? AND user_whatsapp_number = ?',
    [name, contact_userid, contactId, req.user?.whatsappNumber],
    function(this: any, err: any) {
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
    }
  );
});

// Delete a contact
router.delete('/:contactId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { contactId } = req.params;
  
  db.run(
    'DELETE FROM contacts WHERE id = ? AND user_whatsapp_number = ?',
    [contactId, req.user?.whatsappNumber],
    function(this: any, err: any) {
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
    }
  );
});

export default router; 