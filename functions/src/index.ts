import {initializeApp, getApps} from "firebase-admin/app";
import {searchTraps} from "./searchTraps";
import {verifyDiscord} from "./verifyDiscord";
import {exchangeDiscordCode} from "./exchangeDiscordCode";
if (getApps().length === 0) {
  initializeApp();
}

export {searchTraps};
export {verifyDiscord};
export {exchangeDiscordCode};
