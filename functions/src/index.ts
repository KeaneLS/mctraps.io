import {initializeApp, getApps} from "firebase-admin/app";
import {searchTraps} from "./searchTraps";
import {verifyDiscord} from "./verifyDiscord";
import {exchangeDiscordCode} from "./exchangeDiscordCode";
import {addComment} from "./addComment";
import {setCommentVote} from "./setCommentVote";
import {editComment} from "./editComment";
import {softDeleteComment} from "./softDeleteComment";
import {setTrapRating} from "./setTrapRating";
import {submitTrapForReview} from "./submitTrapForReview";
import {reviewTrap} from "./reviewTrap";
if (getApps().length === 0) {
  initializeApp();
}

export {searchTraps};
export {verifyDiscord};
export {exchangeDiscordCode};
export {addComment};
export {setCommentVote};
export {editComment};
export {softDeleteComment};
export {setTrapRating};
export {submitTrapForReview};
export {reviewTrap};
