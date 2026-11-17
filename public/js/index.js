// =========================================================
// index.js  ·  Login. Ahora usa POST /api/usuarios/login
// =========================================================

document.getElementById("btnLogin").addEventListener("click", async (e) => {
  e.preventDefault();

  const usuarioIngresado = document.getElementById("username").value.trim();
  const passwordIngresada = document.getElementById("password").value;

  if (!usuarioIngresado || !passwordIngresada) {
    alert("Completá usuario y contraseña.");
    return;
  }

  try {
    const respuesta = await fetch("/api/usuarios/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: usuarioIngresado, password: passwordIngresada }),
    });

    const cuerpo = await respuesta.json();

    if (!respuesta.ok) {
      // 401: credenciales incorrectas. 400: faltan datos. Otros: error del servidor.
      alert(cuerpo.mensaje || "No se pudo iniciar sesión.");
      return;
    }

    const usuario = cuerpo.datos; // { id_usuario, nom_usuario, tipo }

    localStorage.setItem("usuarioLogueado", JSON.stringify({
      id:     usuario.id_usuario,
      nombre: usuario.nom_usuario,
      tipo:   usuario.tipo,
    }));

    window.location.href = usuario.tipo === "empresa" ? "mainEmpresa.html" : "main.html";

  } catch (err) {
    console.error("Error inesperado:", err);
    alert("No se pudo conectar con el servidor.");
  }
});
