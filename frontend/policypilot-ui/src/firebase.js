// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAau3nqRWq8pFXNRDUMKa9Uw0UEhlvWxio",
  authDomain: "iar-hackathon.firebaseapp.com",
  projectId: "iar-hackathon",
  storageBucket: "iar-hackathon.firebasestorage.app",
  messagingSenderId: "660291936018",
  appId: "1:660291936018:web:16e6133038365563b71dcb",
  measurementId: "G-E808N1317S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };