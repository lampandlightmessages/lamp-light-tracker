// ── Supabase client ──────────────────────────────────────────
const SUPABASE_URL = 'https://bnqlfghxaxcpabbmshst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucWxmZ2h4YXhjcGFiYm1zaHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTYzMTQsImV4cCI6MjA4OTk3MjMxNH0.byUx_UIrW9sjWxl3C5huXNvVdCkpiVlI0r_uepi5tyM';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
