import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

export interface AlertRecord {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: "open" | "acknowledged" | "resolved";
  createdAt?: unknown;
  source: "mobile" | "admin";
}

export const alertsCollection = collection(db, "alerts");

export async function createAlert(input: Omit<AlertRecord, "id">) {
  return addDoc(alertsCollection, {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToAlerts(callback: (items: AlertRecord[]) => void) {
  const q = query(alertsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as DocumentData),
    })) as AlertRecord[];
    callback(items);
  });
}
