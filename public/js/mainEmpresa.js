// =========================================================
// mainEmpresa.js  ·  Panel principal de la empresa
// =========================================================

const contenedor = document.getElementById('pasan-container');

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

        // 2. Sus pasantías
        const pasantias = await obtenerPasantiasDeEmpresa(usuarioActivo.id);

        // 3. Contadores
        const activas = pasantias.filter(pasantiaActiva).length;
        document.getElementById('statActivas').textContent = activas;
        document.getElementById('statFinalizadas').textContent = pasantias.length - activas;

        // 4. Tarjetas
        contenedor.innerHTML = '';

        if (pasantias.length === 0) {
            contenedor.innerHTML = '<p class="empresa-vacio">Todavía no publicaste ninguna pasantía.</p>';
            return;
        }

        pasantias.forEach(p => contenedor.appendChild(crearTarjetaPasantia(p)));

    } catch (err) {
        console.error('Error al cargar el panel de empresa:', err.message);
        contenedor.innerHTML = '<p class="empresa-vacio">Error al cargar tus pasantías.</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarPanelEmpresa);