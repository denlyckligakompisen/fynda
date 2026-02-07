import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD_Y9eym4FSPQFxC8i7Wub56boM3IeXb6o",
    authDomain: "fynda-1c506.firebaseapp.com",
    projectId: "fynda-1c506",
    storageBucket: "fynda-1c506.firebasestorage.app",
    messagingSenderId: "462702385764",
    appId: "1:462702385764:web:105f82e71d93377c7f5d71",
    measurementId: "G-E2TSXMBXNX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
