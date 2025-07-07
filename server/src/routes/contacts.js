const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Add a contact
router.post('/', authenticateToken, (req, res) => {
  const { name, contact_userid } = req.body;

  if (!name || !contact_userid) {
    return res.status(400).json({ error: 'Name and contact_userid are required' });
  }

  const contactId = uuidv4();
  
  db.run(
    'INSERT INTO contacts (id, user_whatsapp_number, name, contact_userid) VALUES (?, ?, ?, ?)',
    [contactId, req.user.whatsappNumber, name, contact_userid],
    (err) => {
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
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT id, name, contact_userid, created_at FROM contacts WHERE user_whatsapp_number = ? ORDER BY name',
    [req.user.whatsappNumber],
    (err, contacts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(contacts);
    }
  );
});

// Get a specific contact
router.get('/:contactId', authenticateToken, (req, res) => {
  const { contactId } = req.params;
  
  db.get(
    'SELECT id, name, contact_userid, created_at FROM contacts WHERE id = ? AND user_whatsapp_number = ?',
    [contactId, req.user.whatsappNumber],
    (err, contact) => {
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
router.put('/:contactId', authenticateToken, (req, res) => {
  const { contactId } = req.params;
  const { name, contact_userid } = req.body;

  if (!name || !contact_userid) {
    return res.status(400).json({ error: 'Name and contact_userid are required' });
  }

  db.run(
    'UPDATE contacts SET name = ?, contact_userid = ? WHERE id = ? AND user_whatsapp_number = ?',
    [name, contact_userid, contactId, req.user.whatsappNumber],
    function(err) {
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
router.delete('/:contactId', authenticateToken, (req, res) => {
  const { contactId } = req.params;
  
  db.run(
    'DELETE FROM contacts WHERE id = ? AND user_whatsapp_number = ?',
    [contactId, req.user.whatsappNumber],
    function(err) {
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

module.exports = router; 