import { auth, db } from "@/config/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

// Step 1: Start Sign Up by sending verification code
export const signUpUser = async (email, password, displayName) => {
  try {
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName,
      photoURL: user.photoURL || "/robotic.png",
      authProvider: "email",
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

    return { success: true, message: "Account created successfully!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Step 2: Verify the code and complete registration
export const verifyEmailCode = async (email, code, password, displayName) => {
  try {
    const verificationRef = doc(db, "emailVerifications", email);
    const verificationSnap = await getDoc(verificationRef);

    if (!verificationSnap.exists()) {
      return { success: false, message: "No verification code found." };
    }

    const { verifyCode, createdAt } = verificationSnap.data();
    const expirationTime = 10 * 60 * 1000; // 10 minutes
    const now = new Date();
    const codeAge = now - createdAt.toDate();

    if (code !== verifyCode) {
      return { success: false, message: "Incorrect verification code." };
    }

    if (codeAge > expirationTime) {
      await deleteDoc(verificationRef);
      return { success: false, message: "Code has expired. Please request a new one." };
    }

    // Create Firebase user
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        return { success: false, message: "User already exists. Please log in." };
      }
      throw error;
    }

    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName,
      photoURL: user.photoURL || "/robotic.png",
      authProvider: "email",
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

    // Clean up verification code
    await deleteDoc(verificationRef);

    return { success: true, user };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, message: error.message };
  }
};

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || "robotic.png",
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
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
