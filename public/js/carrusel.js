/* =========================================================
   CARRUSEL: imágenes desde Supabase Storage + cambio automático
   ========================================================= */


/* ---------- CONFIGURACIÓN (cambiá estos valores) ---------- */

/* =========================================================
   CARRUSEL: imágenes desde Supabase Storage + cambio automático
   ========================================================= */


// Todo va dentro de una función para que los nombres no choquen con otros scripts
(() => {


/* ---------- CONFIGURACIÓN (cambiá estos valores) ---------- */

const SUPABASE_URL = 'https://odqksyoitflwklzhuscb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcWtzeW9pdGZsd2tsemh1c2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMjQ0NDQsImV4cCI6MjEwNzcwMDQ0NH0.uWCx70hCmxUWuF1Bg5KThsDFSouURd8vRmmlYPTAW8I';

const BUCKET = 'carrusel';         // nombre del bucket en Storage (tiene que ser público)
const CARPETA = '';                // subcarpeta dentro del bucket ('' si las imágenes están sueltas)

const SEGUNDOS = 10;                // cada cuánto cambia solo


/* ---------- Elementos del HTML ---------- */

const carrusel = document.querySelector('.carrusel');
const tarjetas = [...carrusel.querySelectorAll('article')];
const contenedorPuntos = carrusel.querySelector('.carrusel-puntos');

// OJO: la librería de Supabase crea una variable global llamada "supabase",
// por eso el cliente se llama "cliente".
// Si ya tenés un cliente creado en tu proyecto, usalo y borrá estas dos líneas.
const cliente = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* ---------- Estado ---------- */

let fotos = [];                // [{ url, alt }, ...] traídas de la base de datos
let actual = 0;                // número de la foto que está en el centro
let lugares = [0, 1, 2, 3];    // qué tarjeta ocupa cada lugar: [izquierda, centro, derecha, oculta]
let temporizador = null;
let puntos = [];


/* ---------- Utilidades ---------- */

// Convierte cualquier número en un índice válido (da la vuelta al llegar al final)
function foto(indice) {
  const total = fotos.length;
  return fotos[((indice % total) + total) % total];
}

function ponerFoto(tarjeta, indice) {
  const img = tarjeta.querySelector('img');
  const f = foto(indice);
  img.src = f.url;
  img.alt = f.alt;
}

function mostrar() {
  const [izq, centro, der, oculta] = lugares;

  tarjetas[izq].className = 'carrusel-side carrusel-izq';
  tarjetas[centro].className = 'carrusel-center';
  tarjetas[der].className = 'carrusel-side carrusel-der';
  tarjetas[oculta].className = 'carrusel-hidde';

  const total = fotos.length;
  const activo = ((actual % total) + total) % total;
  puntos.forEach((punto, i) => punto.classList.toggle('activo', i === activo));
}


/* ---------- Movimiento ---------- */

// Siguiente: la derecha pasa al centro, el centro a la izquierda,
// la izquierda a oculta y la oculta a la derecha
function siguiente() {
  const [izq, centro, der, oculta] = lugares;
  actual++;
  ponerFoto(tarjetas[oculta], actual + 1);   // la oculta va a la derecha: carga la foto que sigue
  lugares = [centro, der, oculta, izq];
  mostrar();
}

// Anterior: lo mismo, pero hacia el otro lado
function anterior() {
  const [izq, centro, der, oculta] = lugares;
  actual--;
  ponerFoto(tarjetas[oculta], actual - 1);   // la oculta va a la izquierda: carga la foto anterior
  lugares = [oculta, izq, centro, der];
  mostrar();
}


/* ---------- Cambio automático ---------- */

function detenerAuto() {
  clearInterval(temporizador);
}

function iniciarAuto() {
  detenerAuto();
  temporizador = setInterval(siguiente, SEGUNDOS * 1000);
}


/* ---------- Carga desde Supabase ---------- */

async function cargarFotos() {
  const { data, error } = await cliente.storage
    .from(BUCKET)
    .list(CARPETA, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
  if (error) throw error;

  return data
    // ignora carpetas, archivos ocultos (.emptyFolderPlaceholder) y lo que no sea imagen
    .filter(archivo => /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(archivo.name))
    .map(archivo => {
      const ruta = CARPETA ? `${CARPETA}/${archivo.name}` : archivo.name;
      return {
        url: cliente.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl,
        alt: 'Imagen del carrusel'
      };
    });
}

async function iniciar() {
  try {
    fotos = await cargarFotos();
  } catch (error) {
    console.error('No se pudieron cargar las imágenes del carrusel:', error);
    return;
  }

  if (fotos.length === 0) {
    console.warn('El bucket del carrusel no tiene imágenes.');
    return;
  }

  // Precarga todas las imágenes para que no tarden al aparecer
  fotos.forEach(f => { new Image().src = f.url; });

  // Un punto por cada imagen
  contenedorPuntos.innerHTML = '';
  puntos = fotos.map(() => {
    const punto = document.createElement('span');
    punto.className = 'punto';
    contenedorPuntos.appendChild(punto);
    return punto;
  });

  // Foto inicial de cada tarjeta: [izquierda, centro, derecha, oculta]
  ponerFoto(tarjetas[lugares[0]], actual - 1);
  ponerFoto(tarjetas[lugares[1]], actual);
  ponerFoto(tarjetas[lugares[2]], actual + 1);
  ponerFoto(tarjetas[lugares[3]], actual + 2);
  mostrar();

  // Botones: al apretar uno, el contador del cambio automático vuelve a empezar
  carrusel.querySelector('.btn-der').addEventListener('click', () => { siguiente(); iniciarAuto(); });
  carrusel.querySelector('.btn-izq').addEventListener('click', () => { anterior(); iniciarAuto(); });

  // Con una sola imagen no hay nada que mover
  if (fotos.length > 1) {
    iniciarAuto();
    carrusel.addEventListener('mouseenter', detenerAuto);   // se pausa con el mouse encima
    carrusel.addEventListener('mouseleave', iniciarAuto);
  }
}

iniciar();

})();