import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyApD4kTyRCkFd4jBxEvgpBhezYDZOj-wL0",
  authDomain: "placement-58290.firebaseapp.com",
  projectId: "placement-58290",
  storageBucket: "placement-58290.firebasestorage.app",
  messagingSenderId: "1072364655316",
  appId: "1:1072364655316:web:b8393d489ffa1a6a4ba141",
  measurementId: "G-DHVJLTPSDX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// SIGNUP FUNCTION
export const signUp = async (email, password, name, role) => {
  try {
    console.log("Starting signup for:", email);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User created in Auth:", user.uid);
    
    // Update profile with name
    await updateProfile(user, { displayName: name });
    console.log("Profile updated");
    
    // Save user data to Firestore
    const userData = {
      uid: user.uid,
      name: name,
      email: email,
      role: role,
      selectedCompany: null,
      testScore: null,
      isSelected: false,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", user.uid), userData);
    console.log("User data saved to Firestore");
    
    return { 
      success: true, 
      user: userData,
      uid: user.uid 
    };
  } catch (error) {
    console.error("Signup Error:", error.code, error.message);
    
    // Handle specific errors
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: "Email already registered. Please login." };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: "Password should be at least 6 characters." };
    } else if (error.code === 'permission-denied') {
      return { success: false, error: "Firestore permissions error. Please update database rules." };
    }
    
    return { success: false, error: error.message };
  }
};

// LOGIN FUNCTION
export const signIn = async (email, password, expectedRole) => {
  try {
    console.log("Starting login for:", email);
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User signed in:", user.uid);
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      console.error("User document not found in Firestore");
      return { success: false, error: "User data not found. Please sign up again." };
    }
    
    const userData = userDoc.data();
    console.log("User role:", userData.role);
    
    // Check if role matches
    if (userData.role !== expectedRole) {
      return { 
        success: false, 
        error: `This account is registered as ${userData.role}, not ${expectedRole}.` 
      };
    }
    
    return { 
      success: true, 
      user: userData,
      uid: user.uid 
    };
  } catch (error) {
    console.error("Login Error:", error.code, error.message);
    
    // Handle specific errors
    if (error.code === 'auth/invalid-credential') {
      return { success: false, error: "Invalid email or password. Please try again." };
    } else if (error.code === 'auth/user-not-found') {
      return { success: false, error: "No account found. Please sign up first." };
    } else if (error.code === 'auth/wrong-password') {
      return { success: false, error: "Incorrect password. Please try again." };
    } else if (error.code === 'permission-denied') {
      return { success: false, error: "Database permission error. Please check Firestore rules." };
    }
    
    return { success: false, error: error.message };
  }
};