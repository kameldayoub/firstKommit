
    // 1. Leemos los datos guardados en el navegador
    const fotoGuardada = localStorage.getItem("fotoPerfil");
    const nombreGuardado = localStorage.getItem("nombreUsuario");

    // 2. Si existen, los asignamos a los elementos del HTML
    if (fotoGuardada) {
      document.getElementById("fotoPerfilImg").src = fotoGuardada;
    } else {
      // Foto por defecto si el usuario no tiene foto asignada
      document.getElementById("fotoPerfilImg").src = "img/defecto.png"; 
    }

    if (nombreGuardado) {
      document.getElementById("nombreUsuarioTexto").textContent = nombreGuardado;
    }

    // // Lógica opcional para cerrar sesión y borrar los datos
    // document.getElementById("btnCerrarSesion").addEventListener("click", () => {
    //   localStorage.clear(); // Limpia la memoria
    //   window.location.href = "login.html"; // Regresa al login
    // });