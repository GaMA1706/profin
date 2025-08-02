// script.js

// Importa las funciones necesarias desde los SDKs de Firebase.
// Asegúrate de usar la versión correcta de los SDKs.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-analytics.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    onSnapshot, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "cd-y-dvd-6f1d8.firebaseapp.com",
    databaseURL: "https://cd-y-dvd-6f1d8-default-rtdb.firebaseio.com",
    projectId: "cd-y-dvd-6f1d8",
    storageBucket: "cd-y-dvd-6f1d8.firebasestorage.app",
    messagingSenderId: "845069801378",
    appId: "1:845069801378:web:e42b093e7dea50ffd3c4fb",
    measurementId: "G-T0V1KJCCJ3"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Variables de elementos del DOM
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const registerContainer = document.getElementById('register-container');
const loginContainer = document.getElementById('login-container');
const productForm = document.getElementById('productForm');
const productList = document.getElementById('productList');
const productCatalogue = document.getElementById('product-list');

// --- Lógica de Autenticación y Redirección ---
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname.split('/').pop();

    if (user) {
        // Usuario autenticado
        if (currentPath === 'index.html' || currentPath === '') {
            // Redirige según el tipo de usuario si están en la página de inicio
            if (user.email.endsWith('@admin.com')) {
                window.location.href = 'administrador.html';
            } else {
                window.location.href = 'catalogo.html';
            }
        } else {
            // El usuario ya está en una página del sistema, carga la funcionalidad correspondiente
            if (currentPath === 'catalogo.html') {
                loadProducts();
            } else if (currentPath === 'administrador.html') {
                loadAdminProducts();
            }
        }
    } else {
        // Usuario no autenticado
        if (currentPath !== 'index.html' && currentPath !== '') {
            // Si no está en la página de inicio, redirige al inicio
            window.location.href = 'index.html';
        }
    }
});

// --- Lógica para alternar formularios de registro/inicio de sesión ---
if (showLoginLink && showRegisterLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });
}

// --- Eventos de formularios y botones ---
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = registerForm['register-email'].value;
        const password = registerForm['register-password'].value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Registro exitoso!");
        } catch (error) {
            alert(error.message);
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Inicio de sesión exitoso!");
        } catch (error) {
            alert("Error al iniciar sesión: " + error.message);
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'index.html';
    });
}

// --- Lógica del panel de administración (Agregar, Editar, Eliminar) ---
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productId = productForm['productId'].value;
        const product = {
            // Corregido el nombre de las variables
            name: productForm['productName'].value,
            description: productForm['productDescription'].value,
            category: productForm['productCategory'].value,
            imageURL: productForm['productImageURL'].value,
            calificacion: parseFloat(productForm['productPrice'].value), // Cambiado 'price' a 'calificacion'
            ubicacion: parseInt(productForm['productStock'].value),      // Cambiado 'stock' a 'ubicacion'
        };

        try {
            if (productId) {
                await updateDoc(doc(db, 'products', productId), product);
                alert("Producto actualizado con éxito!");
            } else {
                await addDoc(collection(db, 'products'), product);
                alert("Producto añadido con éxito!");
            }
            productForm.reset();
            loadAdminProducts();
        } catch (error) {
            alert("Error al guardar el producto: " + error.message);
        }
    });
}

async function loadAdminProducts() {
    if (!productList) return;
    productList.innerHTML = '';
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        productList.innerHTML = '';
        snapshot.forEach((doc) => {
            const product = { ...doc.data(), id: doc.id };
            const productElement = document.createElement('div');
            productElement.className = 'p-4 bg-gray-700 rounded-lg flex justify-between items-center';
            productElement.innerHTML = `
                <div>
                    <h3 class="text-xl font-bold">${product.name}</h3>
                    <p class="text-gray-400">${product.description}</p>
                    <p class="text-lg font-semibold text-purple-400">Calificación: ${product.calificacion}</p>
                    <p>Ubicación: ${product.ubicacion}</p>
                </div>
                <div class="space-x-2">
                    <button class="edit-button px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" data-id="${product.id}">Editar</button>
                    <button class="delete-button px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors" data-id="${product.id}">Eliminar</button>
                </div>
            `;
            productList.appendChild(productElement);
        });

        productList.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (e) => editProduct(e.target.dataset.id));
        });
        productList.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => deleteProduct(e.target.dataset.id));
        });
    });
}

async function editProduct(id) {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const product = docSnap.data();
        productForm['productId'].value = id;
        productForm['productName'].value = product.name;
        productForm['productDescription'].value = product.description;
        productForm['productPrice'].value = product.calificacion;
        productForm['productStock'].value = product.ubicacion;
        productForm['productCategory'].value = product.category;
        productForm['productImageURL'].value = product.imageURL;
        window.scrollTo(0, 0);
    }
}

async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        await deleteDoc(doc(db, 'products', id));
        alert("Producto eliminado con éxito.");
    }
}

// --- Lógica del Catálogo de Productos ---
async function loadProducts() {
    if (!productCatalogue) return;
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        productCatalogue.innerHTML = '';
        snapshot.forEach((doc) => {
            const product = { ...doc.data(), id: doc.id };
            const productCard = document.createElement('div');
            productCard.className = 'product-card bg-gray-800 p-6 rounded-lg shadow-xl hover:shadow-purple-500/50 flex flex-col justify-between';
            productCard.innerHTML = `
                <div>
                    <img src="${product.imageURL || 'https://via.placeholder.com/300'}" alt="${product.name}" class="rounded-lg mb-4 w-full h-48 object-cover">
                    <h3 class="text-2xl font-bold mb-2">${product.name}</h3>
                    <p class="text-gray-400 mb-4">${product.description}</p>
                </div>
                <div class="mt-4">
                    <p class="text-3xl font-bold text-purple-400 mb-4">Calificación: ${product.calificacion}</p>
                    <p class="text-sm text-gray-500">Ubicación: ${product.ubicacion}</p>
                </div>
            `;
            productCatalogue.appendChild(productCard);
        });
    });
}
