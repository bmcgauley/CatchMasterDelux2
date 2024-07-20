import {
    getAuth,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getFirestore, collection, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

// Firebase configuration
const firebaseAppConfig = {
    apiKey: 'AIzaSyA0Nrmbjb297EbKLaBxyBpMEUeWXjgbGUU',
    authDomain: 'catchmaster-delux.firebaseapp.com',
    projectId: 'catchmaster-delux',
    storageBucket: 'catchmaster-delux.appspot.com',
    messagingSenderId: '840913142770',
    appId: '1:840913142770:web:c72e0087fac8854bd1616b',
    measurementId: 'G-XVGLX2EJZH'
};

// Initialize Firebase
const app = initializeApp(firebaseAppConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function signIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            currentUser = user;
            updateUIForSignedInUser(user);
            createUserDocument(user);
            fetchPokemon().then(() => fetchUserPokemonStatus());
        })
        .catch((error) => {
            console.error('Error during sign in:', error);
        });
}

async function createUserDocument(user) {
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
        try {
            await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName
            });
            console.log("User document created successfully");
        } catch (error) {
            console.error("Error creating user document:", error);
        }
    }
}

function signOutUser() {
    signOut(auth)
        .then(() => {
            currentUser = null;
            updateUIForSignedOutUser();
            clearLocalStorage();
            location.reload();
        })
        .catch((error) => {
            console.error('Error during sign out:', error);
        });
}

function clearLocalStorage() {
    try {
        localStorage.removeItem('pokemonData');
        localStorage.removeItem('pendingUpdates');
        console.log('Local storage cleared successfully');
    } catch (error) {
        console.error('Error clearing local storage:', error);
    }
}

export { signIn, signOutUser, auth, db };