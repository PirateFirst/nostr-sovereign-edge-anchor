import 'dotenv/config';
import { SimplePool, getPublicKey, finalizeEvent } from 'nostr-tools';

const pool = new SimplePool();
const relays = [process.argv[3]];

async function declareState(state) {
  const sk = process.env.NOSTR_SECRET_KEY;

  if (!sk) {
    console.error("Missing NOSTR_SECRET_KEY in .env");
    process.exit(1);
  }

  const validStates = ['active', 'overcapacity', 'unavailable'];
  if (!validStates.includes(state)) {
    console.error("State must be: active | overcapacity | unavailable");
    process.exit(1);
  }

  const pubkey = getPublicKey(sk);

  const event = finalizeEvent({
    kind: 30066,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', 'availability'],
      ['state', state]
    ],
    content: `Author is currently ${state}`,
    pubkey
  }, sk);

  await pool.publish(relays, event);
  console.log("✅ State published:", state);
  process.exit(0);
}

declareState(process.argv[2]);
 e639d13 (Initial sovereign edge continuity implementation)
