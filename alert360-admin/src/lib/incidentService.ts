import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

export type IncidentStatus = "pending" | "in-progress" | "resolved";

export interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: IncidentStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  source: "mobile" | "admin";
}

export const incidentsCollection = collection(db, "incidents");

export async function createIncident(input: Omit<IncidentRecord, "id">) {
  return addDoc(incidentsCollection, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToIncidents(callback: (items: IncidentRecord[]) => void) {
  const q = query(incidentsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as DocumentData),
    })) as IncidentRecord[];
    callback(items);
  });
}

export async function updateIncidentStatus(id: string, status: IncidentStatus) {
  const ref = doc(db, "incidents", id);
  return updateDoc(ref, { status, updatedAt: serverTimestamp() });
}
