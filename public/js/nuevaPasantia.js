// =========================================================
// nuevaPasantia.js  ·  Formulario para publicar una pasantía
// =========================================================

// ---- Claves según el esquema de Supabase ----
// pasantia.id_usuario es la FK a empresa (empresa.id_usuario es su PK).
// requisito, tarea e inciso usan claves compuestas:
//   requisito (id_pasantia, nom_requisito)
//   tarea     (id_pasantia, nom_tarea)
//   inciso    (id_pasantia, nom_tarea, nom_inciso)
const COL_ID_EMPRESA = 'id_usuario';

const usuarioActivo = exigirEmpresa();

const form = document.getElementById('formPasantia');
const listaRequisitos = document.getElementById('listaRequisitos');
const listaTareas = document.getElementById('listaTareas');
const mensajeForm = document.getElementById('mensajeForm');
const btnPublicar = document.getElementById('btnPublicar');


// ---------- Helpers de creación de filas ----------

function crearBotonQuitar(alQuitar) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-quitar';
    btn.setAttribute('aria-label', 'Quitar');
    btn.textContent = '×';
    btn.addEventListener('click', alQuitar);
    return btn;
}

// Fila simple: un input + botón de quitar
function crearFila(placeholder, valor = '') {
    const li = document.createElement('li');
    li.className = 'fila-editable';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = valor;
    input.maxLength = 150;

    li.append(input, crearBotonQuitar(() => li.remove()));
    return li;
}

function agregarRequisito(valor = '') {
    listaRequisitos.appendChild(crearFila('Ej: Estudiante de 3er año de Sistemas', valor));
}

// Grupo de tareas (tarea) con sus ítems (inciso)
function agregarTarea() {
    const grupo = document.createElement('div');
    grupo.className = 'grupo-tarea';

    const cabecera = document.createElement('div');
    cabecera.className = 'grupo-tarea-cabecera';

    const titulo = document.createElement('input');
    titulo.type = 'text';
    titulo.className = 'tarea-titulo-input';
    titulo.placeholder = 'Título del grupo (Ej: Soporte técnico)';
    titulo.maxLength = 80;

    cabecera.append(titulo, crearBotonQuitar(() => grupo.remove()));

    const items = document.createElement('ul');
    items.className = 'lista lista-editable';
    items.appendChild(crearFila('Ej: Resolver incidencias de conectividad'));

    const btnItem = document.createElement('button');
    btnItem.type = 'button';
    btnItem.className = 'btn-agregar';
    btnItem.textContent = '+ Agregar tarea';
    btnItem.addEventListener('click', () => {
        items.appendChild(crearFila('Ej: Mantener equipos e insumos'));
    });

    grupo.append(cabecera, items, btnItem);
    listaTareas.appendChild(grupo);
}


// ---------- Botones de agregar ----------

document.getElementById('btnAgregarRequisito').addEventListener('click', () => agregarRequisito());
document.getElementById('btnAgregarTarea').addEventListener('click', agregarTarea);

// Contador de caracteres de la descripción
const descripcion = document.getElementById('descripcion');
const contador = document.getElementById('contadorDescripcion');
descripcion.addEventListener('input', () => {
    contador.textContent = descripcion.value.length;
});

// Estado inicial: un requisito y un grupo de tareas vacíos
agregarRequisito();
agregarTarea();


// ---------- Lectura de datos ----------

function leerFilas(ul) {
    return [...ul.querySelectorAll('input')]
        .map(i => i.value.trim())
        .filter(v => v !== '');
}

function leerFormulario() {
    const tareas = [...listaTareas.querySelectorAll('.grupo-tarea')]
        .map(grupo => ({
            titulo: grupo.querySelector('.tarea-titulo-input').value.trim(),
            items: [...new Set(leerFilas(grupo.querySelector('ul')))]
        }))
        .filter(t => t.titulo !== '' || t.items.length > 0);

    return {
        descripcion_breve: form.descripcion.value.trim(),
        duracion: Number(form.duracion.value),
        cant_hora: Number(form.horasDiarias.value),
        monto: Number(form.monto.value),
        fecha_fin: form.fechaFin.value,
        requisitos: [...new Set(leerFilas(listaRequisitos))],
        tareas
    };
}


// ---------- Validación ----------

function mostrarMensaje(texto, ok = false) {
    mensajeForm.textContent = texto;
    mensajeForm.classList.toggle('ok', ok);
    mensajeForm.hidden = false;
}

function validar(datos) {
    form.querySelectorAll('.campo-error').forEach(c => c.classList.remove('campo-error'));

    // Se valida con el texto crudo para que un monto de 0 sea válido
    const obligatorios = {
        descripcion: form.descripcion.value.trim(),
        duracion: form.duracion.value,
        horasDiarias: form.horasDiarias.value,
        monto: form.monto.value,
        fechaFin: form.fechaFin.value
    };

    let primerError = null;
    for (const [id, valor] of Object.entries(obligatorios)) {
        if (valor === '') {
            const campo = document.getElementById(id);
            campo.closest('.campo').classList.add('campo-error');
            primerError = primerError || campo;
        }
    }

    if (primerError) {
        primerError.focus();
        mostrarMensaje('Completá los campos marcados en rojo.');
        return false;
    }

    if (datos.requisitos.length === 0) {
        mostrarMensaje('Agregá al menos un requisito.');
        return false;
    }

    if (datos.tareas.length === 0 || datos.tareas.some(t => t.titulo === '')) {
        mostrarMensaje('Cada grupo de tareas necesita un título (y agregá al menos uno).');
        return false;
    }

    // Dos grupos con el mismo título chocarían con la clave (id_pasantia, nom_tarea)
    const titulos = datos.tareas.map(t => t.titulo.toLowerCase());
    if (new Set(titulos).size !== titulos.length) {
        mostrarMensaje('Hay dos grupos de tareas con el mismo título.');
        return false;
    }

    // Fecha local (no UTC) para no equivocarse de día por la zona horaria
    const hoy = new Date().toLocaleDateString('en-CA');
    if (datos.fecha_fin <= hoy) {
        document.getElementById('fechaFin').closest('.campo').classList.add('campo-error');
        mostrarMensaje('La fecha de finalización debe ser posterior a hoy.');
        return false;
    }

    mensajeForm.hidden = true;
    return true;
}


// ---------- Envío a Supabase ----------

async function insertar(tabla, filas) {
    const { error } = await _supabase.from(tabla).insert(filas);
    if (error) throw error;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!usuarioActivo) return;

    const datos = leerFormulario();
    if (!validar(datos)) return;

    btnPublicar.disabled = true;
    let idPasantia = null;

    try {
        const empresa = await obtenerEmpresaActiva(usuarioActivo.id);

        // 1. Pasantía
        const { data: nueva, error: errPasantia } = await _supabase
            .from('pasantia')
            .insert({
                [COL_ID_EMPRESA]: empresa[COL_ID_EMPRESA],
                descripcion_breve: datos.descripcion_breve,
                duracion: datos.duracion,
                monto: datos.monto,
                cant_hora: datos.cant_hora,
                fecha_fin: datos.fecha_fin
            })
            .select('id_pasantia')
            .single();

        if (errPasantia) throw errPasantia;
        idPasantia = nueva.id_pasantia;

        // 2. Requisitos
        await insertar('requisito', datos.requisitos.map(nombre => ({
            id_pasantia: idPasantia,
            nom_requisito: nombre
        })));

        // 3. Tareas y sus incisos
        for (const tarea of datos.tareas) {
            const { error: errTarea } = await _supabase
                .from('tarea')
                .insert({ id_pasantia: idPasantia, nom_tarea: tarea.titulo });

            if (errTarea) throw errTarea;

            if (tarea.items.length > 0) {
                await insertar('inciso', tarea.items.map(nombre => ({
                    id_pasantia: idPasantia,
                    nom_tarea: tarea.titulo,
                    nom_inciso: nombre
                })));
            }
        }

        mostrarMensaje('¡Pasantía publicada! Redirigiendo…', true);
        setTimeout(() => { window.location.href = 'mainEmpresa.html'; }, 1500);

    } catch (err) {
        console.error('Error al publicar:', err.message);

        // Si falló a la mitad, intentamos no dejar una pasantía incompleta
        if (idPasantia) {
            await _supabase.from('pasantia').delete().eq('id_pasantia', idPasantia);
        }

        mostrarMensaje('No se pudo publicar la pasantía. Probá de nuevo.');
        btnPublicar.disabled = false;
    }
});