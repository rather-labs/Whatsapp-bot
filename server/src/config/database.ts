import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Create Supabase client
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Test connection
async function testConnection(): Promise<void> {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = relation does not exist (table not created yet)
      console.error('❌ Error connecting to Supabase:', error.message);
      throw error;
    }
    console.log('✅ Connected to Supabase database');
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err);
    throw err;
  }
}

// Initialize connection
testConnection().catch((err) => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});

/**
 * Get recipient number from contacts table
 * @param userNumber - The user's WhatsApp number
 * @param contactName - The contact name
 * @returns contact whatsapp number
 */
export async function getContactWhatsappNumber(userNumber: string, contactName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('contact_whatsapp_number')
      .eq('user_whatsapp_number', userNumber)
      .eq('name', contactName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data?.contact_whatsapp_number || null;
  } catch (err) {
    console.error('Error fetching contact WhatsApp number:', err);
    throw err;
  }
}

/**
 * Get recipient wallet address from contacts table
 * @param userNumber - The user's WhatsApp number
 * @param contactNumber - The contact number
 * @returns contact wallet address
 */
export async function getContactWalletAddress(userNumber: string, contactNumber: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('contact_wallet_address')
      .eq('user_whatsapp_number', userNumber)
      .eq('contact_whatsapp_number', contactNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data?.contact_wallet_address || null;
  } catch (err) {
    console.error('Error fetching contact wallet address:', err);
    throw err;
  }
}

// Graceful shutdown - no specific cleanup needed for Supabase
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  console.log('✅ Supabase connection will be automatically closed');
  process.exit(0);
});

export default supabase; 