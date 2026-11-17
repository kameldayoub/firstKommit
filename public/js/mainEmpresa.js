// =========================================================
// mainEmpresa.js  ·  Panel principal de la empresa
// Usa la API: /api/empresas/:id y /api/pasantias?empresa=..&cantidad=..&from=..
// =========================================================

const contenedor = document.getElementById('pasan-container');
const POR_PAGINA = 6;

function crearTarjetaPasantia(pasantia) {
    const activa = pasantiaActiva(pasantia);

    const link = document.createElement('a');
    link.href = `pasantia.html?id=${pasantia.id_pasantia}`;
    link.classList.add('pasan-view');

    const info = document.createElement('div');
    info.classList.add('pasan-view-info');

    const img = document.createElement('img');
    img.src = pasantia.empresa.usuario.foto_perfil || 'img/placeholderPerfil.png';
    img.alt = pasantia.empresa.nom_empresa;

    const article = document.createElement('article');

    const titulo = document.createElement('h2');
    titulo.textContent = pasantia.empresa.nom_empresa;

    const descripcion = document.createElement('p');
    descripcion.textContent = pasantia.descripcion_breve;

    // Etiquetas de estado
    const estado = document.createElement('div');
    estado.classList.add('empresa-pasan-estado');

    const etiquetaEstado = document.createElement('span');
    etiquetaEstado.classList.add('etiqueta', activa ? 'etiqueta-activa' : 'etiqueta-cerrada');
    etiquetaEstado.textContent = activa ? 'Activa' : 'Finalizada';

    const etiquetaFecha = document.createElement('span');
    etiquetaFecha.classList.add('etiqueta');
    etiquetaFecha.textContent = `${activa ? 'Hasta' : 'Finalizó'} el ${formatearFecha(pasantia.fecha_fin)}`;

    estado.append(etiquetaEstado, etiquetaFecha);

    const masInfo = document.createElement('p');
    masInfo.classList.add('pasan-view-mas-info');
    masInfo.textContent = 'VER';

    article.append(titulo, descripcion, estado);
    info.append(img, article);
    link.append(info, masInfo);

    return link;
}

async function cargarPanelEmpresa() {
    const usuarioActivo = exigirEmpresa();
    if (!usuarioActivo) return;

    contenedor.innerHTML = '<p>Cargando pasantías...</p>';

    try {
        // 1. Datos de la empresa (nombre y foto del header)
        const empresa = await obtenerEmpresaActiva(usuarioActivo.id);
        ponerFotoHeader(empresa.usuario.foto_perfil);
        document.getElementById('empresaNombre').textContent = empresa.nom_empresa;

        // 2. Contadores: se le pide a la API el "total" de cada estado
        const [activas, finalizadas] = await Promise.all([
            contarPasantias(usuarioActivo.id, 'activas'),
            contarPasantias(usuarioActivo.id, 'finalizadas')
        ]);
        document.getElementById('statActivas').textContent = activas;
        document.getElementById('statFinalizadas').textContent = finalizadas;

        // 3. Tarjetas paginadas con botón "Ver más"
        await cargarPaginado({
            contenedor,
            cantidad: POR_PAGINA,
            textoVacio: 'Todavía no publicaste ninguna pasantía.',
            pedir: (cantidad, from) => obtenerPaginaPasantias({
                empresa: usuarioActivo.id, estado: 'todas', cantidad, from
            }),
            crear: crearTarjetaPasantia
        });

    } catch (err) {
        console.error('Error al cargar el panel de empresa:', err.message);
        contenedor.innerHTML = '<p class="empresa-vacio">Error al cargar tus pasantías.</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarPanelEmpresa);
