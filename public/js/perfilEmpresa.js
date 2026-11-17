// =========================================================
// perfilEmpresa.js  ·  Perfil de la empresa logueada
// =========================================================

function crearLinkPasantia(pasantia, foto) {
    const activa = pasantiaActiva(pasantia);

    const link = document.createElement('a');
    link.classList.add('perfil-pasan-link');
    link.href = `pasantia.html?id=${pasantia.id_pasantia}`;

    const img = document.createElement('img');
    img.classList.add('perfil-pasan-logo');
    img.src = foto || 'img/placeholderPerfil.png';
    img.alt = '';

    const texto = document.createElement('p');
    texto.textContent = `${activa ? 'Hasta' : 'Finalizó'} el ${formatearFecha(pasantia.fecha_fin)}`;

    link.append(img, texto);
    return link;
}

async function cargarPerfilEmpresa() {
    const usuarioActivo = exigirEmpresa();
    if (!usuarioActivo) return;

    const contenedor = document.getElementById('pasantiasPublicadas');

    try {
        // 1. Datos de la empresa
        const empresa = await obtenerEmpresaActiva(usuarioActivo.id);
        const foto = empresa.usuario.foto_perfil;

        ponerFotoHeader(foto);
        if (foto) document.getElementById('logo_empresa').src = foto;

        document.getElementById('empresaNombre').textContent = empresa.nom_empresa;
        document.getElementById('empresaDireccion').textContent =
            empresa.direccion_empresa ? `Dirección: ${empresa.direccion_empresa}` : '';

        // 2. Pasantías publicadas
        const pasantias = await obtenerPasantiasDeEmpresa(usuarioActivo.id);

        const activas = pasantias.filter(pasantiaActiva).length;
        document.getElementById('datoActivas').textContent = activas;
        document.getElementById('datoFinalizadas').textContent = pasantias.length - activas;

        contenedor.innerHTML = '';

        if (pasantias.length === 0) {
            contenedor.innerHTML = '<p>Todavía no publicaste pasantías.</p>';
            return;
        }

        pasantias.forEach(p => contenedor.appendChild(crearLinkPasantia(p, foto)));

    } catch (err) {
        console.error('Error al cargar el perfil de empresa:', err.message);
        contenedor.innerHTML = '<p>Error al cargar los datos.</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarPerfilEmpresa);