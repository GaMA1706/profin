// Importa las funciones necesarias de los SDKs de Firebase para el navegador
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, query, where, getDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

// === INICIALIZACIÓN DE FIREBASE CON LAS NUEVAS CREDENCIALES ===
const firebaseConfig = {
    apiKey: "AIzaSyD8WzxzffnSQ7BoCKwxPC6mEC4abFy6FWM",
    authDomain: "mi-coleccion-8fa8e.firebaseapp.com",
    projectId: "mi-coleccion-8fa8e",
    storageBucket: "mi-coleccion-8fa8e.firebasestorage.app",
    messagingSenderId: "868401315977",
    appId: "1:868401315977:web:17c1830818fc478c864658",
    measurementId: "G-7R45NY1MPS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === VARIABLES DEL DOM ===
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
const cartButton = document.getElementById('cart-button');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.getElementById('cart-count');
const checkoutButton = document.getElementById('checkout-button');

// --- Lógica de Autenticación y Redirección ---
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    const isIndexPage = currentPath.includes('index.html') || currentPath === '/';

    if (user) {
        // Usuario autenticado
        if (isIndexPage) {
            if (user.email.endsWith('@admin.com')) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'catalogo.html';
            }
        }
        
        if (currentPath.includes('catalogo.html')) {
            loadProducts();
            loadCart();
        } else if (currentPath.includes('admin.html')) {
            loadAdminProducts();
        } else if (currentPath.includes('carrito.html')) {
            loadCartItems();
        }
        
    } else {
        // Usuario no autenticado
        if (!isIndexPage) {
            window.location.href = 'index.html';
        }
    }
});

// Registro de usuario
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = registerForm['register-email'].value;
        const password = registerForm['register-password'].value;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: user.email,
                createdAt: new Date(),
            });

            console.log("Registro exitoso, redirigiendo...");
        } catch (error) {
            alert(error.message);
        }
    });
}

// Inicio de sesión de usuario
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Inicio de sesión exitoso, redirigiendo...");
        } catch (error) {
            alert(error.message);
        }
    });
}

// Cerrar sesión
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await signOut(auth);
        console.log("Sesión cerrada, redirigiendo a index.html");
    });
}

// Lógica para alternar formularios de registro/inicio de sesión
if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (registerContainer && loginContainer) {
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        }
    });
}

if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginContainer && registerContainer) {
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
        }
    });
}

// --- Lógica de la aplicación (Admin, Catálogo, Carrito) ---
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productId = productForm['productId'].value;
        const product = {
            name: productForm['productName'].value,
            description: productForm['productDescription'].value,
            price: parseFloat(productForm['productPrice'].value),
            stock: parseInt(productForm['productStock'].value),
            category: productForm['productCategory'].value,
            imageURL: productForm['productImageURL'].value,
            createdAt: new Date()
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
    const q = query(productsRef);

    onSnapshot(q, (snapshot) => {
        productList.innerHTML = '';
        snapshot.forEach((doc) => {
            const product = { ...doc.data(), id: doc.id };
            const productElement = document.createElement('div');
            productElement.className = 'p-4 bg-gray-700 rounded-lg flex justify-between items-center';
            productElement.innerHTML = `
                <div>
                    <h3 class="text-xl font-bold">${product.name}</h3>
                    <p class="text-gray-400">${product.description}</p>
                    <p class="text-lg font-semibold text-purple-400">$${product.price.toFixed(2)}</p>
                    <p>Stock: ${product.stock}</p>
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
        productForm['productPrice'].value = product.price;
        productForm['productStock'].value = product.stock;
        productForm['productCategory'].value = product.category;
        productForm['productImageURL'].value = product.imageURL;
        window.scrollTo(0, 0);
    }
}

async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        await deleteDoc(doc(db, 'products', id));
    }
}

async function loadProducts() {
    if (!productCatalogue) return;
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('stock', '>', 0));

    onSnapshot(q, (snapshot) => {
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
                    <p class="text-3xl font-bold text-purple-400 mb-4">$${product.price.toFixed(2)}</p>
                    <p class="text-sm text-gray-500">Stock: ${product.stock}</p>
                    <button class="add-to-cart-button w-full px-4 py-2 mt-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors" data-id="${product.id}">Añadir al Carrito</button>
                </div>
            `;
            productCatalogue.appendChild(productCard);
        });

        productCatalogue.querySelectorAll('.add-to-cart-button').forEach(button => {
            button.addEventListener('click', (e) => addToCart(e.target.dataset.id));
        });
    });
}

async function addToCart(productId) {
    const user = auth.currentUser;
    if (!user) {
        alert("Debes iniciar sesión para añadir productos al carrito.");
        return;
    }
    
    const cartRef = collection(db, 'carts');
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (!productDoc.exists()) {
        alert("Producto no encontrado.");
        return;
    }
    
    const productData = productDoc.data();
    if (productData.stock <= 0) {
        alert("Lo sentimos, este producto está agotado.");
        return;
    }

    const cartQuery = query(cartRef, where('userId', '==', user.uid), where('productId', '==', productId));
    const cartSnapshot = await getDocs(cartQuery);

    if (!cartSnapshot.empty) {
        const cartItemDoc = cartSnapshot.docs[0];
        await updateDoc(doc(db, 'carts', cartItemDoc.id), {
            quantity: cartItemDoc.data().quantity + 1
        });
    } else {
        await addDoc(cartRef, {
            userId: user.uid,
            productId: productId,
            name: productData.name,
            price: productData.price,
            imageURL: productData.imageURL,
            quantity: 1
        });
    }

    await updateDoc(doc(db, 'products', productId), {
        stock: productData.stock - 1
    });
}

function loadCart() {
    const user = auth.currentUser;
    if (!user || !cartCountElement) return;

    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', user.uid));

    onSnapshot(q, (snapshot) => {
        let totalItems = 0;
        snapshot.forEach(doc => {
            totalItems += doc.data().quantity;
        });
        cartCountElement.textContent = totalItems;
    });
    
    if (cartButton) {
        cartButton.addEventListener('click', () => {
            window.location.href = 'carrito.html';
        });
    }
}

async function loadCartItems() {
    const user = auth.currentUser;
    if (!user || !cartItemsContainer) return;
    
    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', user.uid));

    onSnapshot(q, (snapshot) => {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        snapshot.forEach(doc => {
            const item = { ...doc.data(), id: doc.id };
            total += item.price * item.quantity;
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'flex items-center justify-between p-4 bg-gray-700 rounded-lg';
            cartItemElement.innerHTML = `
                <div class="flex items-center space-x-4">
                    <img src="${item.imageURL || 'https://via.placeholder.com/100'}" alt="${item.name}" class="w-16 h-16 rounded-lg">
                    <div>
                        <h3 class="text-xl font-bold">${item.name}</h3>
                        <p class="text-gray-400">$${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                </div>
                <div class="text-xl font-bold">$${(item.price * item.quantity).toFixed(2)}</div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });
        cartTotalElement.textContent = total.toFixed(2);
    });

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            alert("Compra finalizada con éxito! (Esta es una función simulada)");
            const user = auth.currentUser;
            if (user) {
                const cartRef = collection(db, 'carts');
                const q = query(cartRef, where('userId', '==', user.uid));
                getDocs(q).then(snapshot => {
                    snapshot.forEach(doc => {
                        deleteDoc(doc.ref);
                    });
                });
            }
            window.location.href = 'catalogo.html';
        });
    }
}
