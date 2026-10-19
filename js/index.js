
document.getElementById("btnLogin").addEventListener("click", async (e) => {
  e.preventDefault();

  const usuarioIngresado = document.getElementById("username").value.trim();
  const passwordIngresada = document.getElementById("password").value;

  if (!usuarioIngresado || !passwordIngresada) {
    alert("Completá usuario y contraseña.");
    return;
  }

  try {
    const { data, error } = await _supabase.rpc("fn_login", {
      p_usuario:  usuarioIngresado,
      p_password: passwordIngresada,
    });

    if (error) {
      console.error("Error en la consulta:", error.message);
      alert("Error en la consulta: " + error.message);
      return;
    }

    if (data && data.length > 0) {
      const usuario = data[0];

      localStorage.setItem("usuarioLogueado", JSON.stringify({
        id:     usuario.id_usuario,
        nombre: usuario.nom_usuario,
        tipo:   usuario.tipo,       
      }));

      console.log("Usuario logueado:", localStorage.getItem("usuarioLogueado"));

      window.location.href = "main.html";
    } else {
      alert("Usuario o contraseña incorrectos.");
    }

  } catch (err) {
    console.error("Error inesperado:", err);
  }
});
