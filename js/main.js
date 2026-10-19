
async function cargarFotoPerfil(nom_usuario) {
  try {
    const { data: usuario, error } = await _supabase
      .from('usuario')
      .select('imgPerfil_url')
      .eq('nom_usuario', nom_usuario)
      .single();

    if (error) {
      console.error('Error al traer datos:', error.message);
      return;
    }

    if (usuario && usuario.imgPerfil_url) {
      console.log('entro :',usuario);
      const imagenesPerfil = document.querySelectorAll('#imgPerfil');

      imagenesPerfil.forEach(imgElemento => {
        imgElemento.src = usuario.imgPerfil_url;
      });
    }else{
      console.log('problema:',usuario);

    }

  } catch (err) {
    console.error('Error inesperado:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Leemos el usuario guardado en localStorage (viene como texto JSON)
  const usuarioActivoRaw = localStorage.getItem('usuarioLogueado');

  if (usuarioActivoRaw) {
    // 2. Lo convertimos de texto a objeto JS
    const usuarioActivo = JSON.parse(usuarioActivoRaw);

    console.log('Usuario activo:', usuarioActivo);
    console.log('Usuario nobre:', usuarioActivo.nombre);
    // 3. Le pasamos solo el nombre de usuario a la función
    cargarFotoPerfil(usuarioActivo.nombre);
  } else {
    // Si no hay usuario guardado, lo devolvemos al login
    window.location.href = 'index.html';
  }
});
