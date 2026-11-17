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


// =========================================================
// HELPERS PARA LAS PÁGINAS DE EMPRESA
// =========================================================

// Valor que guarda usuario.tipo para las empresas (lo devuelve fn_login).
// Si en tu base se llama distinto, cambialo acá y listo.
const TIPO_EMPRESA = 'empresa';

// Devuelve el usuario logueado solo si es una empresa.
// Si no hay sesión va al login; si es estudiante lo manda a main.html.
function exigirEmpresa() {
  const usuario = obtenerUsuarioActivo();
  if (!usuario) return null;

  if (usuario.tipo !== TIPO_EMPRESA) {
    window.location.href = 'main.html';
    return null;
  }
  return usuario;
}

// Trae la fila de empresa que pertenece al usuario logueado,
// junto con su usuario (foto_perfil).
async function obtenerEmpresaActiva(idUsuario) {
  const { data, error } = await _supabase
    .from('empresa')
    .select('*, usuario!inner(id_usuario, nom_usuario, foto_perfil)')
    .eq('usuario.id_usuario', idUsuario)
    .single();

  if (error) throw error;
  return data;
}

// Todas las pasantías de la empresa del usuario (activas y finalizadas)
async function obtenerPasantiasDeEmpresa(idUsuario) {
  const { data, error } = await _supabase
    .from('pasantia')
    .select(`
      id_pasantia,
      descripcion_breve,
      fecha_fin,
      empresa!inner (
        nom_empresa,
        usuario!inner ( id_usuario, foto_perfil )
      )
    `)
    .eq('empresa.usuario.id_usuario', idUsuario)
    .order('fecha_fin', { ascending: false });

  if (error) throw error;
  return data;
}

// Misma regla que usa la vista del estudiante: activa = fecha_fin futura
function pasantiaActiva(pasantia) {
  return new Date(pasantia.fecha_fin) > new Date();
}

// '2026-12-31' -> '31/12/2026' (sin pasar por Date, para evitar corrimientos de zona horaria)
function formatearFecha(fecha) {
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

// Pone la foto del usuario en todos los <img id="foto_perfil">
function ponerFotoHeader(url) {
  if (!url) return;
  document.querySelectorAll('#foto_perfil').forEach(img => { img.src = url; });
}