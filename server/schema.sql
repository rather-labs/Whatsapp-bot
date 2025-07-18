-- Supabase Database Schema for WhatsApp Bot Smart Wallet
-- Run these commands in your Supabase SQL editor to create the necessary tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  whatsapp_number TEXT PRIMARY KEY,
  username TEXT,
  encrypted_pin TEXT NOT NULL,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  user_whatsapp_number TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_whatsapp_number TEXT NOT NULL,
  contact_wallet_address TEXT,
  FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number) ON DELETE CASCADE,
  UNIQUE(user_whatsapp_number, contact_whatsapp_number),
  UNIQUE(user_whatsapp_number, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_number ON users(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_contacts_user_whatsapp_number ON contacts(user_whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_whatsapp_number ON contacts(contact_whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (adjust as needed for your security requirements)
CREATE POLICY "Service role can access all users" ON users
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can access all contacts" ON contacts
  FOR ALL USING (current_setting('role') = 'service_role');

-- Grant necessary permissions to the service role
GRANT ALL ON users TO service_role;
GRANT ALL ON contacts TO service_role; 