
async function cargarFotoPerfil(nom_usuario) {
  try {
    const { data: usuario, error } = await _supabase
      .from('usuario')
      .select('foto_perfil')
      .eq('nom_usuario', nom_usuario)
      .single();

    if (error) {
      console.error('Error al traer datos:', error.message);
      return;
    }

    if (usuario && usuario.foto_perfil) {
      const imagenesPerfil = document.querySelectorAll('#foto_perfil');

      imagenesPerfil.forEach(imgElemento => {
        imgElemento.src = usuario.foto_perfil;
      });
    }else{
      console.log('problema:',usuario);

    }

  } catch (err) {
    console.error('Error inesperado:', err);
  }
}

const carrusel = document.querySelector('.carrusel');
const tarjetas = [...carrusel.querySelectorAll('article')];
const puntos = [...carrusel.querySelectorAll('.punto')];

// Qué tarjeta ocupa cada lugar: [izquierda, centro, derecha, oculta]
// Los números son la posición de cada tarjeta en el HTML (0 = Carrusel 1, etc.)
let lugares = [0, 1, 2, 3];

function mostrar() {
  const [izq, centro, der, oculta] = lugares;

  tarjetas[izq].className = 'carrusel-side carrusel-izq';
  tarjetas[centro].className = 'carrusel-center';
  tarjetas[der].className = 'carrusel-side carrusel-der';
  tarjetas[oculta].className = 'carrusel-hidde';

  // El punto activo es el de la tarjeta que está en el centro
  puntos.forEach((punto, i) => punto.classList.toggle('activo', i === centro));
}

// Siguiente: la derecha pasa al centro, el centro a la izquierda,
// la izquierda a oculta y la oculta a la derecha
function siguiente() {
  const [izq, centro, der, oculta] = lugares;
  lugares = [centro, der, oculta, izq];
  mostrar();
}

// Anterior: lo mismo, pero hacia el otro lado
function anterior() {
  const [izq, centro, der, oculta] = lugares;
  lugares = [oculta, izq, centro, der];
  mostrar();
}

carrusel.querySelector('.btn-der').addEventListener('click', siguiente);
carrusel.querySelector('.btn-izq').addEventListener('click', anterior);

mostrar();




document.addEventListener('DOMContentLoaded', () => {
  // 1. Leemos el usuario guardado en localStorage (viene como texto JSON)
  const usuarioActivoRaw = localStorage.getItem('usuarioLogueado');

  if (usuarioActivoRaw) {
    // 2. Lo convertimos de texto a objeto JS
    const usuarioActivo = JSON.parse(usuarioActivoRaw);

    // 3. Le pasamos solo el nombre de usuario a la función
    cargarFotoPerfil(usuarioActivo.nombre);
  } else {
    // Si no hay usuario guardado, lo devolvemos al login
    window.location.href = 'index.html';
  }
});
