import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAau3nqRWq8pFXNRDUMKa9Uw0UEhlvxio",
  authDomain: "iar-hackathon.firebaseapp.com",
  projectId: "iar-hackathon",
  storageBucket: "iar-hackathon.appspot.com",
  messagingSenderId: "660291936018",
  appId: "1:660291936018:web:16e6133038365563b71dcb",
  measurementId: "G-E808N1317S"
};


let app = null;
let auth = null;
let db = null;
let googleProvider = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.error("Failed to initialize Firebase:", e);
}

export { app, auth, db, googleProvider };