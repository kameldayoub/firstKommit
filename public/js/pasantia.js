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

    } catch (err) {
        console.error('Error al cargar detalle:', err.message);
    }
}

document.addEventListener('DOMContentLoaded', cargarContenidoPasantia);
