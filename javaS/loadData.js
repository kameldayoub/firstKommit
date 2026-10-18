// 1. Reemplaza con los valores que copiaste de tu panel de Supabase
const SUPABASE_URL = "https://odqksyoitflwklzhuscb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcWtzeW9pdGZsd2tsemh1c2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMjQ0NDQsImV4cCI6MjEwNzcwMDQ0NH0.uWCx70hCmxUWuF1Bg5KThsDFSouURd8vRmmlYPTAW8I";

// 2. Crear la conexión
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función para cargar los datos del usuario
async function cargarFotoPerfil(username) {
  try {
    const { data: usuario, error } = await _supabase
      .from('usuario')
      .select('imgPerfil_url')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Error al traer datos:', error.message);
      return;
    }

    if (usuario && usuario.imgPerfil_url) {
      // 1. Selecciona TODOS los elementos con la clase 'imgPerfil'
      const imagenesPerfil = document.querySelectorAll('#imgPerfil');

      // 2. Le asigna la URL a cada uno de ellos
      imagenesPerfil.forEach(imgElemento => {
        imgElemento.src = usuario.imgPerfil_url;
      });
    }

  } catch (err) {
    console.error('Error inesperado:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Leemos el usuario guardado en localStorage
  const usuarioActivo = localStorage.getItem('usuarioLogueado');

  if (usuarioActivo) {
    // 2. Llamamos a la función pasándole el usuario
    cargarFotoPerfil(usuarioActivo);
  } else {
    // Si no hay usuario guardado, lo devolvemos al login
    window.location.href = 'index.html';
  }
});
