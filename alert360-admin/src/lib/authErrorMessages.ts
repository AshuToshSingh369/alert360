export function getAuthErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return `Firebase authentication failed: ${error}`;
  }

  if (error && typeof error === "object") {
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
    const message = "message" in error && typeof error.message === "string" ? error.message : undefined;

    if (code === "auth/popup-closed-by-user") {
      return "Google sign-in was cancelled. Please try again.";
    }

    if (code === "auth/account-exists-with-different-credential") {
      return "That email is already linked to another sign-in method. Try signing in with the original provider.";
    }

    if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
      return "The email or password is incorrect. Please try again.";
    }

    if (code === "auth/weak-password") {
      return "Please choose a stronger password with at least 6 characters.";
    }

    if (code === "auth/email-already-in-use") {
      return "That email is already registered. Please sign in instead.";
    }

    if (message) {
      return message;
    }
  }

  return "Firebase authentication failed. Please check your internet connection and try again.";
}
