// =========================================================
// utils.js  ·  Funciones compartidas por las páginas de empresa
// Ya no usa Supabase: todo pasa por la API (/api/...).
// =========================================================

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

// Valor que devuelve la API en usuario.tipo para las empresas
const TIPO_EMPRESA = 'empresa';

// Devuelve el usuario logueado solo si es una empresa.
function exigirEmpresa() {
  const usuario = obtenerUsuarioActivo();
  if (!usuario) return null;

  if (usuario.tipo !== TIPO_EMPRESA) {
    window.location.href = 'main.html';
    return null;
  }
  return usuario;
}


// =========================================================
// LLAMADAS A LA API
// =========================================================

// Hace el fetch y convierte los errores de la API en un Error de JS.
//   * Si la API responde 400/404/500, se lanza un Error con el mensaje
//     claro que mandó el servidor (error.message) y su código (error.status).
//   * Si el servidor está apagado, se lanza un Error propio.
async function llamarApi(url, opciones) {
  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch (e) {
    throw new Error('No se pudo conectar con el servidor');
  }

  let cuerpo = null;
  try { cuerpo = await respuesta.json(); } catch (e) { /* sin cuerpo JSON */ }

  if (!respuesta.ok) {
    const detalle = cuerpo && cuerpo.errores && cuerpo.errores.length
      ? ': ' + cuerpo.errores.join(' · ')
      : '';
    const error = new Error(((cuerpo && cuerpo.mensaje) || `Error ${respuesta.status}`) + detalle);
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}

// GET /api/empresas/:id  (el id de la empresa es el id del usuario)
async function obtenerEmpresaActiva(idUsuario) {
  const respuesta = await llamarApi(`/api/empresas/${idUsuario}`);
  return respuesta.datos; // { nom_empresa, direccion_empresa, usuario: { foto_perfil }, ... }
}

// GET /api/pasantias?cantidad=..&from=..&estado=..&empresa=..
// Devuelve { datos, total }
async function obtenerPaginaPasantias({ empresa, estado = 'todas', cantidad, from }) {
  const params = new URLSearchParams({ cantidad, from, estado });
  if (empresa) params.set('empresa', empresa);
  return llamarApi(`/api/pasantias?${params}`);
}

// Cuántas pasantías hay en cierto estado: se pide 1 sola y se lee "total"
async function contarPasantias(empresa, estado) {
  const respuesta = await obtenerPaginaPasantias({ empresa, estado, cantidad: 1, from: 0 });
  return respuesta.total || 0;
}


// =========================================================
// PAGINACIÓN CON BOTÓN "VER MÁS"
// =========================================================
// Pide la primera página, la dibuja y, si quedan más, muestra un botón
// que pide la siguiente (from aumenta en la cantidad ya mostrada).
//   contenedor : elemento donde se agregan las tarjetas
//   cantidad   : cuántas se piden por página
//   pedir      : (cantidad, from) => Promise<{ datos, total }>
//   crear      : (item) => elemento DOM
async function cargarPaginado({ contenedor, cantidad, pedir, crear, textoVacio }) {
  let from = 0;
  contenedor.innerHTML = '';

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-ver-mas';
  boton.textContent = 'Ver más';
  boton.style.cssText = 'display:none;margin:20px auto;padding:10px 28px;cursor:pointer;';
  contenedor.insertAdjacentElement('afterend', boton);

  async function cargarPagina() {
    boton.disabled = true;
    try {
      const { datos, total } = await pedir(cantidad, from);

      if (from === 0 && datos.length === 0) {
        contenedor.innerHTML = `<p class="empresa-vacio">${textoVacio}</p>`;
        return;
      }

      datos.forEach(item => contenedor.appendChild(crear(item)));
      from += datos.length;
      boton.style.display = from < (total || 0) ? 'block' : 'none';

    } catch (err) {
      console.error('Error al cargar página:', err.message);
      if (from === 0) contenedor.innerHTML = '<p class="empresa-vacio">Error al cargar los datos.</p>';
      else alert(err.message);
    } finally {
      boton.disabled = false;
    }
  }

  boton.addEventListener('click', cargarPagina);
  await cargarPagina();
}


// =========================================================
// HELPERS DE FORMATO
// =========================================================

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
