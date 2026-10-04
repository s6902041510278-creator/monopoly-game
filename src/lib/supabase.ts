import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lhnhfnmseryasrqpqxfc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxobmhmbm1zZXJ5YXNycXBxeGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODc5MzUsImV4cCI6MjEwNjI2MzkzNX0.z53HG4e6dtzPrZ6_67vEipeEg5dTeTcD2yRyw_YwA6Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);