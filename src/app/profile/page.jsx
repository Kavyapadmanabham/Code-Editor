"use client"; // Mark this file as a client component

import React, { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase"; // Firebase config
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, setDoc, updateDoc  } from "firebase/firestore";
//import {arrayRemove, arrayUnion} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast, ToastContainer } from "react-toastify"; // Import Toast
import "react-toastify/dist/ReactToastify.css"; // Import Toast styles
import logout from "@/helpers/logoutHelp";
import { FaArrowLeft } from "react-icons/fa"; // Importing the icon for the back button

const Profile = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  //const [invites, setInvites] = useState([]); // Store invitations
  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setEmail(currentUser.email);
      //fetchInvites(currentUser.uid);
    } else {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, []);

  /*const fetchInvites = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setInvites(userSnap.data().invites || []);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  };*/

  const handlePasswordReset = async () => {
    if (!email) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent successfully. Please check your inbox.");
      toast.success("Password reset link sent to your email!"); // Show success toast
      setIsDialogOpen(false);
    } catch (error) {
      setErrorMessage("Error sending password reset email: " + error.message);
      toast.error("Error sending password reset email "); // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  /*const handleAcceptInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const membersRef = doc(db, `workspaces/${workspaceId}/members`, user.uid);
      await setDoc(membersRef, {
        userId: user.uid,
        role: "contributor",
        displayName: user.displayName || "Unknown",
        photoURL: user.photoURL || "/robotic.png",
      });

      // Step 2: Remove the invite from the user's document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      // Update UI
      setInvites(invites.filter((id) => id !== workspaceId));
      toast.success("You have joined the workspace as a contributor!"); // Success toast
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error("Error accepting invite!"); // Error toast
    }
  };

  const handleDeleteInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      // Update UI
      setInvites(invites.filter((id) => id !== workspaceId));
      toast.success("Invite deleted successfully."); // Success toast
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error("Error deleting invite!"); // Error toast
    }
  };*/

  const isGoogleUser = user && user.providerData.some((provider) => provider.providerId === "google.com");

  const handleGoBack = () => {
    router.push("/dashboard"); // Redirect to the dashboard
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-16 h-16 mb-4 border-2 border-blue-500">
            <AvatarImage src={auth.currentUser?.photoURL || "/robotic.png"} alt="Profile" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-semibold text-blue-400">{user?.displayName || "User"}</h1>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>

        {/* Logout Button */}
        <Button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 text-sm font-medium py-2 rounded-md mb-6 text-class"
        >
          Logout
        </Button>

        {/* Go Back to Dashboard Button */}
        <button
          onClick={handleGoBack}
          className="w-full text-white bg-opacity-20 ring-1 ring-blue-400  bg-blue-600 hover:bg-blue-700 text-sm font-medium py-2 rounded-md mb-6 flex items-center justify-center"
        >
          <FaArrowLeft className="mr-2" />
           Dashboard
        </button>

        {/* Change Password Section */}

        {/* Invitations Section 
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">Pending Invitations</h2>
          {invites.length > 0 ? (
            invites.map((workspaceId) => (
              <div key={workspaceId} className="bg-gray-700 p-3 rounded-md flex justify-between items-center mb-3">
                <span className="text-sm text-gray-200">Workspace ID: {workspaceId}</span>
                <div className="flex gap-2">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-xs font-medium px-3 py-1 rounded-md"
                    onClick={() => handleAcceptInvite(workspaceId)}
                  >
                    Accept
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-xs font-medium px-3 py-1 rounded-md"
                    onClick={() => handleDeleteInvite(workspaceId)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No pending invitations.</p>
          )}
        </div>*/}
      </div>

      {/* Toast Container for notifications */}
      <ToastContainer position="top-right" theme="dark" />
    </div>
  );
};

export default Profile;
