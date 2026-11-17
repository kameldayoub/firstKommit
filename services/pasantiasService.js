// =========================================================
// services/pasantiasService.js  ·  Lógica de negocio y acceso a la base
//
// El service es la ÚNICA capa que habla con Supabase. No sabe nada de
// HTTP (no usa req ni res): recibe datos, consulta la base y devuelve
// datos, o tira ApiError si algo no se puede (404, 500...).
// =========================================================

const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');

// Qué columnas (y relaciones) se piden en el listado
const CAMPOS_RESUMEN = `
  id_pasantia, id_usuario, descripcion_breve, fecha_fin, duracion, monto, cant_hora,
  empresa!inner ( nom_empresa, usuario!inner ( foto_perfil ) )
`;

// Y en el detalle de una pasantía
const CAMPOS_DETALLE = `
  id_pasantia, id_usuario, descripcion_breve, fecha_creacion, fecha_fin, duracion, monto, cant_hora,
  empresa!inner ( nom_empresa, direccion_empresa, usuario!inner ( foto_perfil ) ),
  requisito ( nom_requisito ),
  tarea ( nom_tarea, inciso ( nom_inciso ) )
`;


// ---------- Varios recursos (paginado) ----------

async function listar({ cantidad, from, estado, empresa }) {
  let consulta = supabase
    .from('pasantia')
    .select(CAMPOS_RESUMEN, { count: 'exact' }); // count: cuántas hay en total (para paginar)

  const ahora = new Date().toISOString();
  if (estado === 'activas') consulta = consulta.gt('fecha_fin', ahora);
  else if (estado === 'finalizadas') consulta = consulta.lte('fecha_fin', ahora);
  // estado === 'todas' -> sin filtro de fecha

  if (empresa) consulta = consulta.eq('id_usuario', empresa);

  // Para paginar hace falta un orden estable; si no, una misma fila podría
  // aparecer en dos páginas. .range(desde, hasta) incluye ambos extremos.
  const { data, error, count } = await consulta
    .order('fecha_fin', { ascending: false })
    .order('id_pasantia', { ascending: true })
    .range(from, from + cantidad - 1);

  if (error) {
    // PGRST103: se pidió una página más allá del final => lista vacía, no error
    if (error.code === 'PGRST103') return { datos: [], total: null };
    throw ApiError.baseDeDatos(error, 'listar pasantías');
  }

  return { datos: data, total: count };
}


// ---------- Un solo recurso ----------

async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('pasantia')
    .select(CAMPOS_DETALLE)
    .eq('id_pasantia', id)
    .maybeSingle(); // devuelve null (en vez de error) si no hay ninguna fila

  if (error) throw ApiError.baseDeDatos(error, 'obtener pasantía');
  if (!data) throw new ApiError(404, `No existe la pasantía con id ${id}`);

  return data;
}


// ---------- Crear ----------

// Borra en orden inverso a la creación: inciso depende de tarea,
// y tarea / requisito dependen de pasantia.
async function borrarPasantiaCompleta(id) {
  await supabase.from('inciso').delete().eq('id_pasantia', id);
  await supabase.from('tarea').delete().eq('id_pasantia', id);
  await supabase.from('requisito').delete().eq('id_pasantia', id);
  await supabase.from('pasantia').delete().eq('id_pasantia', id);
}

async function crear(datos) {
  // 1. La empresa tiene que existir
  const { data: empresa, error: errEmpresa } = await supabase
    .from('empresa')
    .select('id_usuario')
    .eq('id_usuario', datos.id_usuario)
    .maybeSingle();

  if (errEmpresa) throw ApiError.baseDeDatos(errEmpresa, 'buscar empresa');
  if (!empresa) throw new ApiError(404, `No existe la empresa con id ${datos.id_usuario}`);

  // 2. La pasantía
  const { data: nueva, error: errPasantia } = await supabase
    .from('pasantia')
    .insert({
      id_usuario: datos.id_usuario,
      descripcion_breve: datos.descripcion_breve,
      duracion: datos.duracion,
      monto: datos.monto,
      cant_hora: datos.cant_hora,
      fecha_creacion: new Date().toISOString(),
      fecha_fin: datos.fecha_fin,
    })
    .select('id_pasantia')
    .single();

  if (errPasantia) throw ApiError.baseDeDatos(errPasantia, 'crear pasantía');
  const idPasantia = nueva.id_pasantia;

  // 3. Requisitos, tareas e incisos. Son varias inserciones sueltas (no una
  //    transacción): si alguna falla, se deshace todo lo anterior a mano.
  try {
    const { error: errReq } = await supabase
      .from('requisito')
      .insert(datos.requisitos.map(nom => ({ id_pasantia: idPasantia, nom_requisito: nom })));
    if (errReq) throw ApiError.baseDeDatos(errReq, 'crear requisitos');

    for (const tarea of datos.tareas) {
      const { error: errTarea } = await supabase
        .from('tarea')
        .insert({ id_pasantia: idPasantia, nom_tarea: tarea.nom_tarea });
      if (errTarea) throw ApiError.baseDeDatos(errTarea, 'crear tarea');

      if (tarea.incisos.length > 0) {
        const { error: errInciso } = await supabase
          .from('inciso')
          .insert(tarea.incisos.map(nom => ({
            id_pasantia: idPasantia,
            nom_tarea: tarea.nom_tarea,
            nom_inciso: nom,
          })));
        if (errInciso) throw ApiError.baseDeDatos(errInciso, 'crear incisos');
      }
    }
  } catch (err) {
    await borrarPasantiaCompleta(idPasantia); // rollback manual
    throw err;
  }

  return obtenerPorId(idPasantia);
}


// ---------- Actualizar ----------

// PUT reemplaza los datos propios de la pasantía (duración, monto, horas,
// descripción y fecha de fin). Requisitos y tareas no se tocan acá.
async function actualizar(id, datos) {
  const { data, error } = await supabase
    .from('pasantia')
    .update(datos)
    .eq('id_pasantia', id)
    .select('id_pasantia')
    .maybeSingle();

  if (error) throw ApiError.baseDeDatos(error, 'actualizar pasantía');
  if (!data) throw new ApiError(404, `No existe la pasantía con id ${id}`);

  return obtenerPorId(id);
}

module.exports = { listar, obtenerPorId, crear, actualizar };