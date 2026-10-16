// 1. Importaciones desde CDN directo (sin npm)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
// Importamos getAuth y signInWithEmailAndPassword
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
// 2. Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCOyoOakCvMlthf5lK4-lQLsLMpdJ21FL8",
    authDomain: "firstkommit.firebaseapp.com",
    projectId: "firstkommit",
    storageBucket: "firstkommit.firebasestorage.app",
    messagingSenderId: "1031486190508",
    appId: "1:1031486190508:web:8bd2e95213e2b6d6180009",
    measurementId: "G-S6YBK6CXLB"
};

// 3. Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Recibimos dos parámetros: username y password
async function iniciarSesion(usuarioIngresado, contraIngresada) {
    try {
        // Firebase verifica username y contraseña al mismo tiempo
        const q = query(
            collection(db, "USUARIO"),
            where("nombre_usuario", "==", usuarioIngresado),
            where("contra", "==", contraIngresada)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            // 1. Obtenemos los datos del documento encontrado
            console.log("¡Usuario y contraseña correctos!");

            // 2. Guardamos la foto y el nombre en la memoria del navegador
            const datosUsuario = querySnapshot.docs[0].data();
            localStorage.setItem("fotoPerfil", datosUsuario.foto_perfil);

            window.location.href = "main.html";
        } else {
            alert("El usuario o la contraseña son incorrectos.");
        }
    } catch (error) {
        console.error("Error al consultar la base de datos:", error);
    }
}

// Capturamos ambos valores al hacer clic
document.getElementById('btnLogin').addEventListener('click', () => {
    const usuario = document.getElementById('username').value.trim();
    const contra = document.getElementById('password').value.trim();

    if (usuario !== "" && contra !== "") {
        iniciarSesion(usuario, contra);
    } else {
        alert("Por favor completa todos los campos.");
    }
});