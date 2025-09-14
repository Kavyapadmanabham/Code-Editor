import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase"; // Firestore instance

// Function to log in with Email and Password
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Logged in with email:", user.email);
    return user;
  } catch (error) {
    console.error("Error logging in with email:", error.message);
    throw new Error("Invalid credentials or user does not exist.");
  }
};

// Function to log in with Google (with user existence check)
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("Logged in with Google:", user.displayName);

    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // Create a new user model in Firestore
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || "/robotic.png",
        authProvider: "google",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        twoFactorEnabled: false,
        workspaces: {},
        settings: {
          theme: "dark",
          fontSize: 14,
          showLineNumbers: true,
          aiSuggestions: true,
        },
        snippets: [],
      });
      console.log("New user created in Firestore:", user.displayName);
    } else {
      console.log("User already exists, logging in:", user.displayName);
    }

    return { success: true, user };
  } catch (error) {
    console.error("Error logging in with Google:", error.message);
    return { success: false, error: error.message };
  }
};
