import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface AuthSession {
  user: User | null;
  role: "admin" | "operator" | "citizen" | "guest";
  loading: boolean;
}

const usersCollection = collection(db, "users");
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function subscribeToAuthSession(callback: (session: AuthSession) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, role: "guest", loading: false });
      return;
    }

    let role: AuthSession["role"] = "citizen";
    try {
      const userDoc = await getDoc(doc(usersCollection, user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as { role?: string };
        if (data.role === "admin" || data.role === "operator") {
          role = data.role;
        }
      }
    } catch (error) {
      console.warn("Unable to resolve role from Firestore", error);
    }

    callback({ user, role, loading: false });
  });
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string, role: AuthSession["role"] = "citizen") {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserRole(credential.user, role);
  return credential;
}

export async function signInWithGoogle(role: AuthSession["role"] = "citizen") {
  const credential = await signInWithPopup(auth, googleProvider);
  await ensureUserRole(credential.user, role);
  return credential;
}

export async function signUpWithGoogle(role: AuthSession["role"] = "citizen") {
  return signInWithGoogle(role);
}

export async function signOutUser() {
  return signOut(auth);
}

export async function ensureUserRole(user: User, role: AuthSession["role"]) {
  const ref = doc(usersCollection, user.uid);
  const existing = await getDoc(ref);
  const existingRole = existing.exists() ? (existing.data()?.role as AuthSession["role"] | undefined) : undefined;
  const resolvedRole = existingRole ?? role;

  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    role: resolvedRole,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
