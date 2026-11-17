// =========================================================
// pruebaCargaPasantia.js  ·  Listado de pasantías para el estudiante
// Usa el endpoint paginado: GET /api/pasantias?cantidad=5&from=0
// =========================================================

const contenedor = document.getElementById('pasan-container');

const POR_PAGINA = 5;   // cuántas pasantías se piden cada vez
let desde = 0;          // cuántas ya se mostraron (es el "from" de la próxima página)

// Botón "Ver más", debajo del listado
const botonVerMas = document.createElement('button');
botonVerMas.type = 'button';
botonVerMas.textContent = 'Ver más';
botonVerMas.style.cssText = 'display:none;margin:20px auto;padding:10px 28px;cursor:pointer;';
contenedor.insertAdjacentElement('afterend', botonVerMas);

function crearTarjeta(item) {
    const linkPasan = document.createElement('a');
    linkPasan.href = `pasantia.html?id=${item.id_pasantia}`;
    linkPasan.classList.add('pasan-view');

    const divPasan = document.createElement('div');
    divPasan.classList.add('pasan-view-info');

    const imgPasan = document.createElement('img');
    imgPasan.src = item.empresa.usuario.foto_perfil || 'img/placeholderPerfil.png';
    imgPasan.alt = item.empresa.nom_empresa;

    const articlePasan = document.createElement('article');

    const nomEmpresa = document.createElement('h2');
    nomEmpresa.textContent = item.empresa.nom_empresa;

    const contPasan = document.createElement('p');
    contPasan.textContent = item.descripcion_breve;

    const pMasInfoPasan = document.createElement('p');
    pMasInfoPasan.classList.add('pasan-view-mas-info');
    pMasInfoPasan.textContent = 'MAS INFO';

    articlePasan.appendChild(nomEmpresa);
    articlePasan.appendChild(contPasan);
    divPasan.appendChild(imgPasan);
    divPasan.appendChild(articlePasan);
    linkPasan.appendChild(divPasan);
    linkPasan.appendChild(pMasInfoPasan);

    return linkPasan;
}

// Pide UNA página a la API y la agrega al final del listado
async function cargarPagina() {
    botonVerMas.disabled = true;

    try {
        const respuesta = await fetch(`/api/pasantias?cantidad=${POR_PAGINA}&from=${desde}&estado=activas`);
        const cuerpo = await respuesta.json();

        if (!respuesta.ok) throw new Error(cuerpo.mensaje || 'Error al pedir las pasantías');

        // La primera vez, sacamos el cartel "Cargando..."
        if (desde === 0) contenedor.innerHTML = '';

        if (desde === 0 && cuerpo.datos.length === 0) {
            contenedor.innerHTML = '<p>No hay pasantías activas.</p>';
            return;
        }

        cuerpo.datos.forEach(item => contenedor.appendChild(crearTarjeta(item)));
        desde += cuerpo.datos.length;

        // Si todavía quedan pasantías sin mostrar, aparece el botón
        botonVerMas.style.display = desde < cuerpo.total ? 'block' : 'none';

    } catch (err) {
        console.error('Error al cargar datos:', err.message);
        if (desde === 0) contenedor.innerHTML = '<p>Error al cargar las pasantías.</p>';
        else alert(err.message);
    } finally {
        botonVerMas.disabled = false;
    }
}

botonVerMas.addEventListener('click', cargarPagina);

document.addEventListener('DOMContentLoaded', () => {
    contenedor.innerHTML = '<p>Cargando pasantías...</p>';
    cargarPagina();
});
