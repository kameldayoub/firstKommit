// =========================================================
// services/empresasService.js
// =========================================================

const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');

// El id de la empresa es su id_usuario (empresa.id_usuario es clave primaria)
async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('empresa')
    .select(`
      id_usuario, nom_empresa, direccion_empresa, descripcion, link_empresa, razon_social,
      usuario!inner ( foto_perfil )
    `)
    .eq('id_usuario', id)
    .maybeSingle();

  if (error) throw ApiError.baseDeDatos(error, 'obtener empresa');
  if (!data) throw new ApiError(404, `No existe la empresa con id ${id}`);

  return data;
}

module.exports = { obtenerPorId };