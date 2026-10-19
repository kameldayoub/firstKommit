const SUPABASE_URL = "https://odqksyoitflwklzhuscb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcWtzeW9pdGZsd2tsemh1c2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMjQ0NDQsImV4cCI6MjEwNzcwMDQ0NH0.uWCx70hCmxUWuF1Bg5KThsDFSouURd8vRmmlYPTAW8I";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
