export const sendVerificationEmail = async (email, code) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
  
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
  