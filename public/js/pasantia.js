// =========================================================
// pasantia.js  ·  Detalle de una pasantía
// Usa GET /api/pasantias/:id (devuelve 404 si no existe)
// =========================================================

async function cargarContenidoPasantia() {
    // id que viene en la URL: pasantia.html?id=...
    const parametros = new URLSearchParams(window.location.search);
    const idPasantia = parametros.get('id');

    if (!idPasantia) {
        console.error("No se encontró ningún ID en la URL.");
        document.body.innerHTML = "<h1>Error: Pasantía no especificada</h1>";
        return;
    }

    try {
        const respuesta = await fetch(`/api/pasantias/${encodeURIComponent(idPasantia)}`);
        const cuerpo = await respuesta.json();

        if (!respuesta.ok) {
            // 404 = no existe, 400 = id inválido
            document.body.innerHTML = '';
            const h1 = document.createElement('h1');
            h1.textContent = respuesta.status === 404
                ? 'Esta pasantía no existe'
                : 'No se pudo cargar la pasantía';
            document.body.appendChild(h1);
            return;
        }

        const pasantia = cuerpo.datos;

        //TITULO
        const tituloContainer = document.getElementById('tituloContainer');
        tituloContainer.innerHTML = '';
        tituloContainer.textContent = pasantia.empresa.nom_empresa;

        //REQUISITO
        const requisitoContainer = document.getElementById('requisitoContainer');
        const requisitoUl = document.createElement('ul');
        requisitoUl.classList.add('lista');
        requisitoContainer.appendChild(requisitoUl);

        pasantia.requisito.forEach(requisito => {
            const li = document.createElement('li');
            li.classList.add('lista-item');
            li.textContent = requisito.nom_requisito;
            requisitoUl.appendChild(li);
        });

        //TAREA
        const tareaContainer = document.getElementById('tareaContainer');

        pasantia.tarea.forEach(tarea => {
            const h4 = document.createElement('h4');
            h4.classList.add('tarea-titulo');
            h4.textContent = tarea.nom_tarea;
            tareaContainer.appendChild(h4);

            //INCISO
            const ul = document.createElement('ul');
            ul.classList.add('lista');
            tareaContainer.appendChild(ul);

            tarea.inciso.forEach(inciso => {
                const li = document.createElement('li');
                li.classList.add('lista-item');
                li.textContent = inciso.nom_inciso;
                ul.appendChild(li);
            });
        });

        // INFORMACIÓN
        const infoContainer = document.getElementById('infoContainer');
        infoContainer.innerHTML = '';

        const h3 = document.createElement('h3');
        h3.classList.add('seccion-titulo');
        h3.textContent = 'Información de la pasantía';
        infoContainer.appendChild(h3);

        // Algunas pasantías viejas tienen estos campos vacíos (null)
        const dato = (valor, sufijo = '') => (valor === null || valor === undefined ? 'No especificado' : `${valor}${sufijo}`);

        //duracion
        const pDuracion = document.createElement('p');
        pDuracion.classList.add('dato');
        pDuracion.innerHTML = `<strong class="dato-etiqueta">Duración:</strong> ${dato(pasantia.duracion, ' meses')}`;
        infoContainer.appendChild(pDuracion);

        //direccion
        const pDireccion = document.createElement('p');
        pDireccion.classList.add('dato');
        pDireccion.innerHTML = `<strong class="dato-etiqueta">Lugar de trabajo:</strong> ${pasantia.empresa?.direccion_empresa || 'No especificado'} `;
        infoContainer.appendChild(pDireccion);

        // MAPA
        const mapaContainer = document.createElement('div');
        mapaContainer.id = 'mapaContainer';
        mapaContainer.style.marginTop = '20px';
        infoContainer.appendChild(mapaContainer);

        const direccion = pasantia.empresa?.direccion_empresa;

        if (direccion) {
            const textoBusqueda = `${direccion}, Neuquén, Argentina`;
            const urlUbicacion = encodeURIComponent(textoBusqueda);

            const iframeMapa = document.createElement('iframe');
            iframeMapa.width = "100%";
            iframeMapa.height = "300";
            iframeMapa.style.border = "0";
            iframeMapa.style.borderRadius = "8px";
            iframeMapa.loading = "lazy";
            iframeMapa.src = `https://maps.google.com/maps?q=${urlUbicacion}&output=embed`;

            mapaContainer.appendChild(iframeMapa);
        } else {
            mapaContainer.innerHTML = '<p class="dato">Dirección no disponible para el mapa.</p>';
        }

        //monto
        const pMonto = document.createElement('p');
        pMonto.classList.add('dato');
        pMonto.innerHTML = `<strong class="dato-etiqueta">Asignación estímulo:</strong> ${pasantia.monto === null ? 'No especificado' : '$ ' + pasantia.monto}`;
        infoContainer.appendChild(pMonto);

        //canthora
        const pCantHora = document.createElement('p');
        pCantHora.classList.add('dato');
        pCantHora.innerHTML = pasantia.cant_hora === null
            ? `<strong class="dato-etiqueta">Cantidad de horas:</strong> No especificado`
            : `<strong class="dato-etiqueta">Cantidad de horas:</strong> ${pasantia.cant_hora}hs diarias (${pasantia.cant_hora * 5}hs semanales)`;
        infoContainer.appendChild(pCantHora);

        // BOTONES "EDITAR" y "FINALIZAR" (solo los ve la empresa dueña)
        agregarBotonesDeEmpresa(pasantia);

    } catch (err) {
        console.error('Error al cargar detalle:', err.message);
    }
}

// Header: foto de perfil y enlaces según el tipo de usuario
async function prepararEncabezado(usuario) {
    // La empresa vuelve a su propio panel y perfil
    if (usuario.tipo === 'empresa') {
        document.querySelectorAll('.header-logo a').forEach(a => { a.href = 'mainEmpresa.html'; });
        document.querySelectorAll('a.icono[href="perfil.html"]').forEach(a => { a.href = 'perfilEmpresa.html'; });
        // "Postulación" y "Enviar CV" son para estudiantes
        document.querySelectorAll('.postulacion, .pasantia-pie').forEach(el => { el.style.display = 'none'; });
    }

    try {
        const respuesta = await fetch(`/api/usuarios/${encodeURIComponent(usuario.id)}`);
        const cuerpo = await respuesta.json();
        if (respuesta.ok && cuerpo.datos.foto_perfil) {
            document.querySelectorAll('#foto_perfil').forEach(img => { img.src = cuerpo.datos.foto_perfil; });
        }
    } catch (err) {
        console.error('No se pudo cargar la foto de perfil:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const raw = localStorage.getItem('usuarioLogueado');
    if (!raw) {
        window.location.href = 'index.html';
        return;
    }
    prepararEncabezado(JSON.parse(raw));
    cargarContenidoPasantia();
});


// =========================================================
// Botones para la empresa dueña de la pasantía
// =========================================================

function agregarBotonesDeEmpresa(pasantia) {
    const raw = localStorage.getItem('usuarioLogueado');
    if (!raw) return;
    const usuario = JSON.parse(raw);

    // Solo la empresa que publicó la pasantía ve los botones.
    // (Es una comodidad de la interfaz; no reemplaza a una autenticación real en el servidor.)
    if (usuario.tipo !== 'empresa' || usuario.id !== pasantia.id_usuario) return;

    const activa = new Date(pasantia.fecha_fin) > new Date();

    const barra = document.createElement('div');
    barra.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:24px;';

    const editar = document.createElement('a');
    editar.href = `editarPasantia.html?id=${pasantia.id_pasantia}`;
    editar.className = 'boton-cv';
    editar.textContent = 'Editar pasantía';
    barra.appendChild(editar);

    if (activa) {
        const btnFinalizar = document.createElement('button');
        btnFinalizar.type = 'button';
        btnFinalizar.className = 'boton-cv';
        btnFinalizar.textContent = 'Finalizar pasantía';
        btnFinalizar.addEventListener('click', () => finalizarPasantia(pasantia, btnFinalizar));
        barra.appendChild(btnFinalizar);
    } else {
        const aviso = document.createElement('p');
        aviso.className = 'dato';
        aviso.textContent = 'Esta pasantía está finalizada. Para reabrirla, editá la fecha de finalización.';
        barra.appendChild(aviso);
    }

    document.getElementById('infoContainer').appendChild(barra);
}

// Finalizar = PUT con la fecha de fin de hoy (deja de ser "activa")
async function finalizarPasantia(pasantia, boton) {
    if (!confirm('¿Finalizar esta pasantía? Dejará de aparecer entre las activas.')) return;

    // El PUT reemplaza todos los datos, así que tienen que estar completos
    if (pasantia.duracion === null || pasantia.monto === null || pasantia.cant_hora === null) {
        alert('A esta pasantía le faltan datos (duración, monto u horas). Completalos desde "Editar pasantía".');
        return;
    }

    boton.disabled = true;

    try {
        const respuesta = await fetch(`/api/pasantias/${encodeURIComponent(pasantia.id_pasantia)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                descripcion_breve: pasantia.descripcion_breve,
                duracion: pasantia.duracion,
                monto: pasantia.monto,
                cant_hora: pasantia.cant_hora,
                fecha_fin: new Date().toLocaleDateString('en-CA') // hoy, AAAA-MM-DD en hora local
            })
        });
        const cuerpo = await respuesta.json();

        if (!respuesta.ok) {
            const detalle = cuerpo.errores ? ': ' + cuerpo.errores.join(' · ') : '';
            throw new Error((cuerpo.mensaje || 'Error') + detalle);
        }

        location.reload();

    } catch (err) {
        console.error('Error al finalizar:', err.message);
        alert('No se pudo finalizar: ' + err.message);
        boton.disabled = false;
    }
}
