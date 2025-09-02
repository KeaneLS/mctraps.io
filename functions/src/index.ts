import {initializeApp, getApps} from "firebase-admin/app";
import {searchTraps} from "./searchTraps";
import {verifyDiscord} from "./verifyDiscord";
import {exchangeDiscordCode} from "./exchangeDiscordCode";
import {addComment} from "./addComment";
import {setCommentVote} from "./setCommentVote";
if (getApps().length === 0) {
  initializeApp();
}

export {searchTraps};
export {verifyDiscord};
export {exchangeDiscordCode};
export {addComment};
export {setCommentVote};
