// 1. Reemplaza con los valores que copiaste de tu panel de Supabase
const SUPABASE_URL = "https://odqksyoitflwklzhuscb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcWtzeW9pdGZsd2tsemh1c2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMjQ0NDQsImV4cCI6MjEwNzcwMDQ0NH0.uWCx70hCmxUWuF1Bg5KThsDFSouURd8vRmmlYPTAW8I";

// 2. Crear la conexión
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Capturar el evento cuando el usuario presiona el botón del login
document.getElementById("btnLogin").addEventListener("click", async (e) => {
  e.preventDefault(); // Evita que la página se recargue

  // Obtenemos los valores escritos en las casillas del HTML
  const usuarioIngresado = document.getElementById("username").value;
  const passwordIngresada = document.getElementById("password").value;

  console.log("Usuario encontrado:", usuarioIngresado);

  console.log("Usuario encontrado:", passwordIngresada);

  try {
    // 3. Consulta a tu tabla existente

    const { data, error } = await _supabase
      .from("usuario")
      .select("*")
      .eq("username", usuarioIngresado) // O la columna que uses para el login
      .eq("password", passwordIngresada);

    if (error) {
      alert("Error en la consulta: " + error.message);
      return;
    }

    if (data && data.length > 0) {
      // 2. GUARDAR EN LOCALSTORAGE (Ocurre en microsegundos)
      localStorage.setItem("usuarioLogueado", usuarioIngresado);

      console.log(
        "Usuario guardado en localStorage:",
        localStorage.getItem("usuarioLogueado"),
      );
      window.location.href = "main.html";
    } else {
      // Si data está vacío, el usuario o la contraseña no coinciden
      alert("Usuario o contraseña incorrectos.");
    }
  } catch (err) {
    console.error("Error inesperado:", err);
  }
});
