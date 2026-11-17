// =========================================================
// editarPasantia.js  ·  Edición de una pasantía
//   1. GET /api/pasantias/:id   -> rellena el formulario
//   2. PUT /api/pasantias/:id   -> guarda los cambios
// "Finalizar ahora" es un PUT con la fecha de fin de hoy.
// =========================================================

const usuarioActivo = exigirEmpresa();

const idPasantia = new URLSearchParams(window.location.search).get('id');

const form = document.getElementById('formEditar');
const mensajeForm = document.getElementById('mensajeForm');
const btnGuardar = document.getElementById('btnGuardar');
const btnFinalizar = document.getElementById('btnFinalizar');
const descripcion = document.getElementById('descripcion');
const contador = document.getElementById('contadorDescripcion');

function mostrarMensaje(texto, ok = false) {
    mensajeForm.textContent = texto;
    mensajeForm.classList.toggle('ok', ok);
    mensajeForm.hidden = false;
}

function hoy() {
    return new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local
}

function actualizarEstado(fechaFin) {
    const activa = new Date(fechaFin) > new Date();
    document.getElementById('estadoPasantia').textContent = activa ? 'Activa' : 'Finalizada';
    btnFinalizar.style.display = activa ? '' : 'none';
}

descripcion.addEventListener('input', () => {
    contador.textContent = descripcion.value.length;
});


// ---------- 1. Cargar los datos actuales ----------

async function cargarPasantia() {
    if (!usuarioActivo) return;

    if (!idPasantia) {
        window.location.href = 'mainEmpresa.html';
        return;
    }

    try {
        const { datos: p } = await llamarApi(`/api/pasantias/${encodeURIComponent(idPasantia)}`);

        // Solo la empresa dueña puede editarla
        if (p.id_usuario !== usuarioActivo.id) {
            alert('No tenés permiso para editar esta pasantía.');
            window.location.href = 'mainEmpresa.html';
            return;
        }

        ponerFotoHeader(p.empresa.usuario.foto_perfil);
        document.getElementById('nombreEmpresa').textContent = p.empresa.nom_empresa;
        document.getElementById('linkCancelar').href = `pasantia.html?id=${p.id_pasantia}`;

        descripcion.value = p.descripcion_breve || '';
        contador.textContent = descripcion.value.length;

        // Si algún dato está vacío (null) queda en blanco y hay que completarlo para guardar
        form.duracion.value = p.duracion ?? '';
        form.horasDiarias.value = p.cant_hora ?? '';
        form.monto.value = p.monto ?? '';
        form.fechaFin.value = String(p.fecha_fin).slice(0, 10);

        actualizarEstado(p.fecha_fin);

    } catch (err) {
        console.error('Error al cargar la pasantía:', err.message);
        if (err.status === 404) {
            alert('Esa pasantía no existe.');
            window.location.href = 'mainEmpresa.html';
        } else {
            mostrarMensaje(err.message);
        }
    }
}


// ---------- 2. Guardar con PUT ----------

function leerFormulario() {
    return {
        descripcion_breve: descripcion.value.trim(),
        duracion: Number(form.duracion.value),
        cant_hora: Number(form.horasDiarias.value),
        monto: Number(form.monto.value),
        fecha_fin: form.fechaFin.value
    };
}

function validar() {
    form.querySelectorAll('.campo-error').forEach(c => c.classList.remove('campo-error'));

    const crudos = {
        descripcion: descripcion.value.trim(),
        duracion: form.duracion.value,
        horasDiarias: form.horasDiarias.value,
        monto: form.monto.value,
        fechaFin: form.fechaFin.value
    };

    let primerError = null;
    for (const [id, valor] of Object.entries(crudos)) {
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

    mensajeForm.hidden = true;
    return true;
}

async function guardar() {
    if (!usuarioActivo || !validar()) return;

    btnGuardar.disabled = true;
    btnFinalizar.disabled = true;

    try {
        await llamarApi(`/api/pasantias/${encodeURIComponent(idPasantia)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leerFormulario())
        });

        mostrarMensaje('¡Cambios guardados! Redirigiendo…', true);
        setTimeout(() => { window.location.href = `pasantia.html?id=${idPasantia}`; }, 1200);

    } catch (err) {
        console.error('Error al guardar:', err.message);
        mostrarMensaje(err.message); // mensaje claro que devuelve la API (400, 404...)
        btnGuardar.disabled = false;
        btnFinalizar.disabled = false;
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    guardar();
});

// "Finalizar ahora": pone la fecha de fin en hoy y guarda
btnFinalizar.addEventListener('click', () => {
    if (!confirm('¿Finalizar esta pasantía? Dejará de aparecer entre las activas.')) return;
    form.fechaFin.value = hoy();
    guardar();
});

document.addEventListener('DOMContentLoaded', cargarPasantia);
