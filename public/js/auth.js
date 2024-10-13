import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { updateUIForSignedInUser, updateUIForSignedOutUser } from './ui.js';
import { syncWithFirestore } from './games.js';

const firebaseConfig = {
    apiKey: "AIzaSyA0Nrmbjb297EbKLaBxyBpMEUeWXjgbGUU",
    authDomain: "catchmaster-delux.firebaseapp.com",
    projectId: "catchmaster-delux",
    storageBucket: "catchmaster-delux.appspot.com",
    messagingSenderId: "840913142770",
    appId: "1:840913142770:web:c72e0087fac8854bd1616b",
    measurementId: "G-XVGLX2EJZH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export let currentUser = null;

export async function signIn() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        currentUser = result.user;
        await updateUserData(currentUser);
        updateUIForSignedInUser();
    } catch (error) {
        console.error('Error signing in:', error);
    }
}

export async function signOutUser() {
    try {
        await syncWithFirestore(); // Sync before signing out
        await signOut(auth);
        currentUser = null;
        updateUIForSignedOutUser();
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

async function updateUserData(user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            lastLogin: new Date()
        });
    } else {
        await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
    }
}

export function updateUIForAuthState(user) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateUI(user));
    } else {
        updateUI(user);
    }
}

function updateUI(user) {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userDisplay = document.getElementById('userDisplay');

    if (user) {
        if (signInButton) signInButton.style.display = 'none';
        if (signOutButton) signOutButton.style.display = 'block';
        if (userDisplay) userDisplay.textContent = `Welcome, ${user.displayName}!`;
    } else {
        if (signInButton) signInButton.style.display = 'block';
        if (signOutButton) signOutButton.style.display = 'none';
        if (userDisplay) userDisplay.textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateUIForAuthState(user);
    });
});

export { db, getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc };
