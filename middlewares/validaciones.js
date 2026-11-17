// =========================================================
// middlewares/validaciones.js  ·  Validación de los datos de entrada
//
// Cada función de acá es un middleware: se ejecuta ANTES del controlador.
//   * Si los datos están mal  -> tira ApiError(400) y el controlador nunca corre.
//   * Si están bien           -> deja los datos "limpios" (sin espacios de más,
//                                con tipos correctos) en req.consulta / req.datos
//                                y llama a next() para seguir.
// =========================================================

const ApiError = require('../utils/ApiError');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// ---------- Helpers ----------

function rechazar(errores) {
  throw new ApiError(400, 'Los datos enviados no son válidos', errores);
}

// '2026-02-30' tiene formato correcto pero NO es una fecha real: se comprueba.
function fechaValida(texto) {
  if (typeof texto !== 'string' || !FECHA.test(texto)) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const f = new Date(Date.UTC(anio, mes - 1, dia));
  return f.getUTCFullYear() === anio && f.getUTCMonth() === mes - 1 && f.getUTCDate() === dia;
}

function hoy() {
  return new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local del servidor
}

// Los parámetros de la URL (?cantidad=10) siempre llegan como texto.
function leerEntero(valor, nombre, { defecto, min, max }, errores) {
  if (valor === undefined) return defecto;
  if (!/^\d+$/.test(String(valor))) {
    errores.push(`${nombre} debe ser un número entero (ejemplo: ${nombre}=${min})`);
    return defecto;
  }
  const n = Number(valor);
  if (n < min || n > max) errores.push(`${nombre} debe estar entre ${min} y ${max}`);
  return n;
}

// Valida una lista de textos y devuelve la lista limpia
function listaDeTextos(valor, nombre, { min, maxItems, maxLen }, errores) {
  if (!Array.isArray(valor)) {
    errores.push(`${nombre} debe ser una lista de textos`);
    return [];
  }
  if (valor.length < min) errores.push(`${nombre} debe tener al menos ${min} elemento(s)`);
  if (valor.length > maxItems) errores.push(`${nombre} admite como máximo ${maxItems} elementos`);

  const limpios = [];
  valor.forEach((v, i) => {
    if (typeof v !== 'string' || v.trim() === '' || v.trim().length > maxLen) {
      errores.push(`${nombre}[${i}] debe ser un texto no vacío de hasta ${maxLen} caracteres`);
    } else {
      limpios.push(v.trim());
    }
  });

  // La base usa estos textos como clave: no puede haber repetidos
  const vistos = new Set();
  for (const t of limpios) {
    const clave = t.toLowerCase();
    if (vistos.has(clave)) errores.push(`${nombre} tiene un elemento repetido: "${t}"`);
    vistos.add(clave);
  }
  return limpios;
}


// ---------- Parámetros de la URL ----------

// Para rutas como /api/pasantias/:id
function validarId(req, res, next) {
  if (!UUID.test(req.params.id)) {
    throw new ApiError(400, `El id "${req.params.id}" no es un UUID válido`);
  }
  next();
}

// GET /api/pasantias?cantidad=10&from=0&estado=activas&empresa=<uuid>
function validarConsultaPasantias(req, res, next) {
  const errores = [];

  const cantidad = leerEntero(req.query.cantidad, 'cantidad', { defecto: 10, min: 1, max: 50 }, errores);
  const from = leerEntero(req.query.from, 'from', { defecto: 0, min: 0, max: 1000000 }, errores);

  const estado = req.query.estado === undefined ? 'activas' : req.query.estado;
  if (!['activas', 'finalizadas', 'todas'].includes(estado)) {
    errores.push('estado debe ser "activas", "finalizadas" o "todas"');
  }

  const empresa = req.query.empresa;
  if (empresa !== undefined && !UUID.test(empresa)) {
    errores.push('empresa debe ser un UUID válido');
  }

  if (errores.length > 0) rechazar(errores);

  req.consulta = { cantidad, from, estado, empresa };
  next();
}


// ---------- Cuerpo (JSON) de POST / PUT ----------

// creando = true  -> POST: exige además empresa, requisitos y tareas
// creando = false -> PUT : solo los datos propios de la pasantía
function limpiarPasantia(body, creando) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errores: ['El cuerpo de la petición debe ser un objeto JSON'], datos: null };
  }

  const errores = [];
  const datos = {};

  const descripcion = typeof body.descripcion_breve === 'string' ? body.descripcion_breve.trim() : '';
  if (descripcion.length < 10 || descripcion.length > 500) {
    errores.push('descripcion_breve es obligatoria y debe ser un texto de 10 a 500 caracteres');
  } else {
    datos.descripcion_breve = descripcion;
  }

  if (!Number.isInteger(body.duracion) || body.duracion < 1 || body.duracion > 36) {
    errores.push('duracion es obligatoria y debe ser un número entero entre 1 y 36 (meses)');
  } else {
    datos.duracion = body.duracion;
  }

  if (!Number.isInteger(body.cant_hora) || body.cant_hora < 1 || body.cant_hora > 12) {
    errores.push('cant_hora es obligatoria y debe ser un número entero entre 1 y 12 (horas diarias)');
  } else {
    datos.cant_hora = body.cant_hora;
  }

  if (typeof body.monto !== 'number' || !Number.isFinite(body.monto) || body.monto < 0) {
    errores.push('monto es obligatorio y debe ser un número mayor o igual a 0');
  } else {
    datos.monto = body.monto;
  }

  if (!fechaValida(body.fecha_fin)) {
    errores.push('fecha_fin es obligatoria y debe ser una fecha real con formato AAAA-MM-DD');
  } else if (creando && body.fecha_fin <= hoy()) {
    errores.push('fecha_fin debe ser posterior a hoy');
  } else {
    datos.fecha_fin = body.fecha_fin;
  }

  if (creando) {
    if (typeof body.id_usuario !== 'string' || !UUID.test(body.id_usuario)) {
      errores.push('id_usuario (la empresa) es obligatorio y debe ser un UUID válido');
    } else {
      datos.id_usuario = body.id_usuario;
    }

    datos.requisitos = listaDeTextos(
      body.requisitos, 'requisitos', { min: 1, maxItems: 20, maxLen: 150 }, errores
    );

    if (!Array.isArray(body.tareas) || body.tareas.length < 1 || body.tareas.length > 10) {
      errores.push('tareas es obligatoria: una lista de 1 a 10 grupos { nom_tarea, incisos }');
    } else {
      const nombres = new Set();
      datos.tareas = body.tareas.map((t, i) => {
        if (t === null || typeof t !== 'object' || Array.isArray(t)) {
          errores.push(`tareas[${i}] debe ser un objeto { nom_tarea, incisos }`);
          return null;
        }
        const nombre = typeof t.nom_tarea === 'string' ? t.nom_tarea.trim() : '';
        if (nombre === '' || nombre.length > 80) {
          errores.push(`tareas[${i}].nom_tarea es obligatorio (hasta 80 caracteres)`);
        } else if (nombres.has(nombre.toLowerCase())) {
          errores.push(`tareas[${i}].nom_tarea está repetido: "${nombre}"`);
        }
        nombres.add(nombre.toLowerCase());

        const incisos = listaDeTextos(
          t.incisos === undefined ? [] : t.incisos,
          `tareas[${i}].incisos`, { min: 0, maxItems: 20, maxLen: 150 }, errores
        );
        return { nom_tarea: nombre, incisos };
      });
    }
  }

  return { errores, datos };
}

function validarCrearPasantia(req, res, next) {
  const { errores, datos } = limpiarPasantia(req.body, true);
  if (errores.length > 0) rechazar(errores);
  req.datos = datos;
  next();
}

function validarActualizarPasantia(req, res, next) {
  const { errores, datos } = limpiarPasantia(req.body, false);
  if (errores.length > 0) rechazar(errores);
  req.datos = datos;
  next();
}

// POST /api/usuarios/login
function validarLogin(req, res, next) {
  const body = req.body;
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    rechazar(['El cuerpo de la petición debe ser un objeto JSON { usuario, password }']);
  }

  const errores = [];
  if (typeof body.usuario !== 'string' || body.usuario.trim() === '') {
    errores.push('usuario es obligatorio y debe ser un texto');
  }
  if (typeof body.password !== 'string' || body.password === '') {
    errores.push('password es obligatoria y debe ser un texto');
  }
  if (errores.length > 0) rechazar(errores);

  req.datos = { usuario: body.usuario.trim(), password: body.password };
  next();
}

module.exports = {
  validarId,
  validarConsultaPasantias,
  validarCrearPasantia,
  validarActualizarPasantia,
  validarLogin,
};