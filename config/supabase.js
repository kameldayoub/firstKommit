
//Conexión a la base de datos
//
// Se crea UNA sola vez y todos los services la reutilizan con require().
// La URL y la clave salen del archivo .env (NO  se escriben en el código).

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Por si en el .env quedó una barra final o "/rest/v1" (siempre me olvido de sacarlo)
const url = (process.env.SUPABASE_URL || '')
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

// La clave SERVICE solo existe en el servidor .
// Si no,se usa la clave anon.
const clave = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

if (!url || !clave) {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_ANON_KEY en el archivo .env');
}

const supabase = createClient(url, clave, {
  auth: { persistSession: false }, // en un servidor no hay "sesión del navegador"
});

module.exports = supabase;