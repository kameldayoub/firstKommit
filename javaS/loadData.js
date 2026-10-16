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
      .from('usuario') // <-- Nombre de tu tabla de usuarios
      .select('imgPerfil_url') // <-- Nombre de la columna que contiene la URL de la foto de perfil
      .eq('username', username)   // <-- Filtra por el username del usuario logueado
      .single(); // <-- Espera un solo registro
    if (error) {
      console.error('Error al traer datos del usuario:', error);
      return;
    }
// Diagnóstico: mira en la consola qué devuelven los datos
    console.log('Datos del usuario recibidos:', usuario);

    if (usuario && usuario.imgPerfil_url) {
      const imgElemento = document.getElementById('imgPerfil');
      
      if (imgElemento) {
        imgElemento.src = usuario.imgPerfil_url;
      } else {
        console.error('No se encontró el elemento HTML con id="imgPerfil"');
      }
    } else {
      console.warn('El usuario no tiene una URL de foto asignada.');
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
