const boton = document.getElementById('btnCrear');
const contenedor = document.getElementById('pasan-container');



async function cargarPasantias() {

    contenedor.innerHTML = '<p>Cargando pasantías...</p>';

    try {
        const { data: pasantias, error } = await _supabase
            .from('pasantia')
            .select(`id_pasantia, descripcion_breve, empresa!inner ( nom_empresa,usuario!inner ( foto_perfil))`)
            .gt('fecha_fin', new Date().toISOString()); // Mayor que la fecha actual


        /*
        COMO SE VE EL ARRAY DEVUELTO
        [
            {
                "id_pasantia": "12345-abcde",
                "descripcion_breve": "En esta pasantía mantendrás los planes...",
                "empresa": {
                "nom_empresa": "BPN",
                "usuario": {
                    "imgPerfil_url": "imagen/logoBPN.png"
                }
                }
            }
            ]
        
        */


        if (error) throw error;




        // Limpiar contenedor antes de renderizar
        contenedor.innerHTML = '';

        if (pasantias.length === 0) {
            contenedor.innerHTML = '<p>No hay pasantías activas.</p>';
            return;
        }

        // 3. Iterar y construir el DOM
        pasantias.forEach(item => {
            const linkPasan = document.createElement('a');
            linkPasan.href = 'pasantiaBPN.html';
            linkPasan.classList.add('pasan-view');

            const divPasan = document.createElement('div');
            divPasan.classList.add('pasan-view-info');

            const imgPasan = document.createElement('img');
            // CORREGIDO: Usar '=' en lugar de '()' y la barra '/' para la ruta
            imgPasan.src = item.empresa.usuario.foto_perfil;
            imgPasan.alt = item.empresa.nom_empresa;

            const articlePasan = document.createElement('article');

            nomEmpresa = document.createElement('h2');
            nomEmpresa.textContent = item.empresa.nom_empresa;

            const contPasan = document.createElement('p');
            contPasan.textContent = item.descripcion_breve;

            const pMasInfoPasan = document.createElement('p');
            pMasInfoPasan.classList.add('pasan-view-mas-info');
            pMasInfoPasan.textContent = 'MAS INFO';

            // Armado de la estructura interna (de adentro hacia afuera)
            articlePasan.appendChild(nomEmpresa);
            articlePasan.appendChild(contPasan);

            divPasan.appendChild(imgPasan);
            divPasan.appendChild(articlePasan);

            linkPasan.appendChild(divPasan);
            linkPasan.appendChild(pMasInfoPasan);

            // Insertar la tarjeta completa en el contenedor principal
            contenedor.appendChild(linkPasan);
        });

    } catch (err) {
        console.error('Error al cargar datos:', err.message);
        contenedor.innerHTML = '<p>Error al cargar las pasantías.</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarPasantias);