import express, { type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/database';
import { isValidAddress, isValidNumber } from '../utils/vault';
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
    const { error } = await supabase
      .from('contacts')
      .insert({
        id: id,
        user_whatsapp_number: userId,
        name: contactName.toLowerCase(),
        contact_whatsapp_number: contactNumber,
        contact_wallet_address: null
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ message: 'Contact already exists' });
      }
      return res.status(500).json({ message: 'Failed to add contact' });
    }

    return res.status(200).json({
      message: `✅ Contact ${contactName} with number ${contactNumber} added successfully`
    });
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

    const { data, error } = await supabase
      .from('contacts')
      .update({ contact_wallet_address: contactAddress })
      .or(`and(user_whatsapp_number.eq.${userId},name.ilike.${contactId.toLowerCase()}),and(user_whatsapp_number.eq.${userId},contact_whatsapp_number.eq.${contactId})`)
      .select();

    if (error) {
      return res.status(500).json({ message: '❌ *Failed to update wallet address* \n\nPlease try again later.' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: '❌ *Contact not found* \n\nPlease make sure the contact name or number is correct.' });
    }

    return res.status(200).json({
      message: `✅ Wallet address ${contactAddress} for contact ${contactId} updated successfully`
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router; 