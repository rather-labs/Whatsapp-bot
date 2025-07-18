import express, { type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { isValidAddress, isValidNumber } from '../utils/vault';
import type { RunResult } from 'sqlite3';
import ContractService from '../services/contractService';

const router = express.Router();

// Routes defined below

// Endpoint to add a new contact
router.post('/set', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, contactName, contactNumber } = req.body;

    // Validate required parameters
    if (!whatsappNumber || !contactName || !contactNumber) {
      return res.status(400).json({ message: 'whatsappNumber, contactName and contactNumber are required' });
    }

    const userId = ContractService.generateUserId(whatsappNumber).toString();
    
    if (!isValidNumber(userId) || !isValidNumber(contactNumber)) {
      return res.status(400).json({ message: 'Invalid whatsappNumber or contactNumber' });
    }

    // Generate a contact id
    const id = uuidv4();

    // Insert into database
    db.run(
      `INSERT INTO contacts (id, user_whatsapp_number, name, contact_whatsapp_number, contact_wallet_address)
       VALUES (?, ?, ?, ?, ?)` ,
      [id, userId, contactName.toLowerCase(), contactNumber, null],
      (err: unknown) => {
        if (err) {
          if (err instanceof Error && err.message.includes('UNIQUE')) {
            return res.status(409).json({ message: 'Contact already exists' });
          }
          return res.status(500).json({ message: 'Failed to add contact' });
        }
        return res.status(200).json({
          message: `✅ Contact ${contactName} with number ${contactNumber} added successfully`
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Endpoint to update a contact wallet address
router.post('/setwallet', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, contactId, contactAddress } = req.body; // contactIdentifier can be name or number

    if (!whatsappNumber || !contactId || !contactAddress) {
      return res.status(400).json({ message: 'whatsappNumber, contactId and contactAddress are required' });
    }

    const userId = ContractService.generateUserId(whatsappNumber).toString();
    
    if (!isValidAddress(contactAddress)) {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }

    console.log('contactId', contactId);
    console.log('contactAddress', contactAddress);
    console.log('userId', userId);

    db.run(
      `UPDATE contacts
       SET contact_wallet_address = ?
       WHERE user_whatsapp_number = ?
         AND (LOWER(name) = LOWER(?) OR contact_whatsapp_number = ?)` ,
      [contactAddress, userId, contactId, contactId],
      function (err: unknown) {
        if (err) {
          return res.status(500).json({ message: '❌ *Failed to update wallet address* \n\nPlease try again later.' });
        }

        if ((this as RunResult).changes === 0) {
          return res.status(404).json({ message: '❌ *Contact not found* \n\nPlease make sure the contact name or number is correct.' });
        }

        return res.status(200).json({
          message: `✅ Wallet address ${contactAddress} for contact ${contactId} updated successfully`
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router; 