import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2gwTZzpRqJxi818uayUpcwTz_ry_j9HM",
  authDomain: "authentication-1de46.firebaseapp.com",
  projectId: "authentication-1de46",
  storageBucket: "authentication-1de46.firebasestorage.app",
  messagingSenderId: "863031272001",
  appId: "1:863031272001:web:aa365a54665aa567ff5cc0",
  measurementId: "G-FMTLX04JLE",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();