

async function cargarContenidoPasantia() {
    //obteenr la pasantia  de la redireccion del preview
    const parametros = new URLSearchParams(window.location.search);
    const idPasantia = parametros.get('id');

    // Si alguien entra a pasantia.html sin hacer clic en una tarjeta, cortamos la ejecución
    if (!idPasantia) {
        console.error("No se encontró ningún ID en la URL.");
        document.body.innerHTML = "<h1>Error: Pasantía no especificada</h1>";
        return;
    }

    try {
        const { data: pasantia, error } = await _supabase
            .from('pasantia')
            .select(`
                duracion,
                monto,
                cant_hora,
                empresa!inner (
                    nom_empresa,
                    direccion_empresa
                ),
                requisito (
                    nom_requisito
                ),
                tarea (
                    nom_tarea,
                    inciso (
                        nom_inciso
                    )
                )
            `)
            .eq('id_pasantia', idPasantia)
            .single();

        if (error) throw error;

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

        //duracion
        const pDuracion = document.createElement('p');
        pDuracion.classList.add('dato');
        pDuracion.innerHTML = `<strong class="dato-etiqueta">Duración:</strong> ${pasantia.duracion} meses`;
        infoContainer.appendChild(pDuracion);
                
        //direccion
        const pDireccion = document.createElement('p');
        pDireccion.classList.add('dato');
        pDireccion.innerHTML = `<strong class="dato-etiqueta">Lugar de trabajo:</strong> ${pasantia.empresa?.direccion_empresa} `;
        infoContainer.appendChild(pDireccion);

        // 1. CREAMOS EL CONTENEDOR DEL MAPA DINÁMICAMENTE AQUÍ
        const mapaContainer = document.createElement('div');
        mapaContainer.id = 'mapaContainer';
        mapaContainer.style.marginTop = '20px'; // Separación visual del texto
        infoContainer.appendChild(mapaContainer);

        const direccion = pasantia.empresa?.direccion_empresa;

        if (direccion) {
            // Agregamos la ciudad y país a la variable para que Google Maps sea más preciso
            const textoBusqueda = `${direccion}, Neuquén, Argentina`;
            
            // encodeURIComponent convierte los espacios en un formato seguro para la URL (ej: %20)
            const urlUbicacion = encodeURIComponent(textoBusqueda);
            
            const iframeMapa = document.createElement('iframe');
            iframeMapa.width = "100%";
            iframeMapa.height = "300"; // Podés ajustar la altura que prefieras
            iframeMapa.style.border = "0";
            iframeMapa.style.borderRadius = "8px"; // Para que quede más estético
            iframeMapa.loading = "lazy";
            
            // Esta es la URL estándar gratuita para incrustar búsquedas de Google Maps
            iframeMapa.src = `https://maps.google.com/maps?q=${urlUbicacion}&output=embed`;

            mapaContainer.appendChild(iframeMapa);
        } else {
            mapaContainer.innerHTML = '<p class="dato">Dirección no disponible para el mapa.</p>';
        }


        //monto
        const pMonto = document.createElement('p');
        pMonto.classList.add('dato');
        pMonto.innerHTML = `<strong class="dato-etiqueta">Asignación estímulo:</strong> $ ${pasantia.monto}`;
        infoContainer.appendChild(pMonto);

        //canthora
        const pCantHora = document.createElement('p');
        pCantHora.classList.add('dato');
        pCantHora.innerHTML = `<strong class="dato-etiqueta">Cantidad de horas:</strong> ${pasantia.cant_hora}hs diarias (${pasantia.cant_hora * 5}hs semanales)`;
        infoContainer.appendChild(pCantHora);

        

    } catch (err) {
        console.error('Error al cargar detalle:', err.message);
    }
}

// Ejecutar automáticamente al abrir la página
document.addEventListener('DOMContentLoaded', cargarContenidoPasantia);