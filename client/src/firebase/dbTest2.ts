import { db } from "./config";
import { collection, getDocs } from "firebase/firestore";

async function readMyData() {
  const querySnapshot = await getDocs(collection(db, "traps"));
  const traps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(traps);
  return traps;
}

export default readMyData;