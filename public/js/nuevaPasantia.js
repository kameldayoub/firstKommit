// =========================================================
// nuevaPasantia.js  ·  Formulario para publicar una pasantía
// =========================================================

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


// ---------- Envío a la API ----------
// Un solo POST /api/pasantias: el servidor crea la pasantía, los requisitos,
// las tareas y los incisos, y si algo falla deshace todo.

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!usuarioActivo) return;

    const datos = leerFormulario();
    if (!validar(datos)) return;

    btnPublicar.disabled = true;

    try {
        await llamarApi('/api/pasantias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuarioActivo.id,
                descripcion_breve: datos.descripcion_breve,
                duracion: datos.duracion,
                cant_hora: datos.cant_hora,
                monto: datos.monto,
                fecha_fin: datos.fecha_fin,
                requisitos: datos.requisitos,
                tareas: datos.tareas.map(t => ({ nom_tarea: t.titulo, incisos: t.items }))
            })
        });

        mostrarMensaje('¡Pasantía publicada! Redirigiendo…', true);
        setTimeout(() => { window.location.href = 'mainEmpresa.html'; }, 1500);

    } catch (err) {
        console.error('Error al publicar:', err.message);
        // err.message trae el mensaje claro que devolvió la API (por ejemplo, qué campo está mal)
        mostrarMensaje(err.message);
        btnPublicar.disabled = false;
    }
});
