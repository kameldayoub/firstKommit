// =========================================================
// supabaseClient.js
// Crea el cliente de Supabase que usan todos los demás JS (_supabase).
// TOP IMPORTANT NO OLVIDAR:  Requiere que antes se cargue la librería desde el CDN:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// =========================================================


const SUPABASE_URL = 'https://odqksyoitflwklzhuscb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VIFiROq1TNdHv9Ne7ogv1g_hfUUKAA8';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);