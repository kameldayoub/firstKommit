function obtenerUsuarioActivo() {
  const raw = localStorage.getItem('usuarioLogueado');
  if (!raw) {
    window.location.href = 'index.html';
    return null;
  }
  return JSON.parse(raw);
}

function cerrarSesion() {
  localStorage.removeItem('usuarioLogueado');
  window.location.href = 'index.html';
}