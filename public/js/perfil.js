// =========================================================
// perfil.js  ·  Foto de perfil del estudiante
// Usa GET /api/usuarios/:id
// =========================================================

async function cargarFotoPerfil(idUsuario) {
  try {
    const respuesta = await fetch(`/api/usuarios/${encodeURIComponent(idUsuario)}`);
    const cuerpo = await respuesta.json();

    if (!respuesta.ok) {
      console.error('Error al traer datos:', cuerpo.mensaje);
      return;
    }

    const usuario = cuerpo.datos;

    if (usuario.foto_perfil) {
      document.querySelectorAll('#foto_perfil').forEach(img => {
        img.src = usuario.foto_perfil;
      });
    }

  } catch (err) {
    console.error('Error inesperado:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const usuarioActivoRaw = localStorage.getItem('usuarioLogueado');

  if (usuarioActivoRaw) {
    const usuarioActivo = JSON.parse(usuarioActivoRaw);
    cargarFotoPerfil(usuarioActivo.id);
  } else {
    window.location.href = 'index.html';
  }
});
