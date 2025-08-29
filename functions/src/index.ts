import {initializeApp, getApps} from "firebase-admin/app";
import {searchTraps} from "./searchTraps";

if (getApps().length === 0) {
  initializeApp();
}

export {searchTraps};
