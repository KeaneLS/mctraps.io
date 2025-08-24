import { db } from "./config";
import { collection, addDoc, getDocs } from "firebase/firestore";

async function addMyData() {
  try {
    const docRef = await addDoc(collection(db, "traps"), {
      name: "Wall Spike Surprise",
      creators: ["Player123", "Player456"],  // array of creators
      dateInvented: "2020-06-15",
      type: "main",                         // "main" or "backup"
      videoUrl: "https://www.youtube.com/watch?v=example", 
      thumbnailUrl: "https://example.com/trap-thumbnail.jpg",
      minigame: "Spike Maze",
      tierlistRating: 4.5,                  // average rating
      comments: [
        {
          user: "Player789",
          text: "This trap always gets me lol",
          postedAt: new Date(),
        },
        {
          user: "TrapMaster",
          text: "Good counter: jump timing",
          postedAt: new Date(),
        }
      ]
    });
    console.log("Trap written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding trap: ", e);
  }
}

export default addMyData;