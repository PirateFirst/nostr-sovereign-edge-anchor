// stewardship_resolver.js
const { relayInit } = require('nostr-tools');
require('websocket-polyfill');

const KIND_AUTH = 30067;
const KIND_STEWARDSHIP = 30068;

/**
 * Resolve the currently ACTIVE steward for a given anchor,
 * enforcing authorization and lease expiry.
 */
async function resolveSteward(author_pubkey, anchor_ref, relay_url) {
  const relay = relayInit(relay_url);
  const now = Math.floor(Date.now() / 1000);

  try {
    await relay.connect();
  } catch {
    return {
      anchor: anchor_ref,
      active_steward: null,
      lease_expiry: null,
      error: "Relay unreachable"
    };
  }

  // 1. Fetch latest authorized_edges
  const authorizedEdges = await new Promise((resolve) => {
    let latestAuth = null;
    const sub = relay.sub([{
      kinds: [KIND_AUTH],
      authors: [author_pubkey],
      '#d': ['authorized_edges']
    }]);

    sub.on('event', (ev) => {
      if (!latestAuth || ev.created_at > latestAuth.created_at) {
        latestAuth = ev;
      }
    });

    sub.on('eose', () => {
      sub.unsub();
      const edges = latestAuth
        ? latestAuth.tags.filter(t => t[0] === 'p').map(t => t[1])
        : [];
      resolve(edges);
    });
  });

  // 2. Fetch stewardship claims
  const events = await new Promise((resolve) => {
    const collected = [];
    const sub = relay.sub([{
      kinds: [KIND_STEWARDSHIP],
      authors: [author_pubkey],
      '#d': [anchor_ref]
    }]);

    sub.on('event', ev => collected.push(ev));
    sub.on('eose', () => {
      sub.unsub();
      resolve(collected);
    });
  });

  relay.close();

  // 3. Resolve ACTIVE, non-expired, authorized steward
  const active = events
    .filter(ev => {
      const exp = ev.tags.find(t => t[0] === 'expiration');
      const status = ev.tags.find(t => t[0] === 'status');
      const authorRef = ev.tags.find(t => t[0] === 'p' && t[1] === author_pubkey);

      return (
        exp &&
        parseInt(exp[1]) > now &&
        status &&
        status[1] === 'ACTIVE' &&
        authorizedEdges.includes(ev.pubkey) &&
        authorRef
      );
    })
    .sort((a, b) => b.created_at - a.created_at)[0];

  if (!active) {
    return { anchor: anchor_ref, active_steward: null, lease_expiry: null };
  }

  const expTag = active.tags.find(t => t[0] === 'expiration');

  return {
    anchor: anchor_ref,
    active_steward: active.pubkey,
    lease_expiry: parseInt(expTag[1])
  };
}

// CLI usage
const [,, author, anchor, relay] = process.argv;
if (author && anchor && relay) {
  resolveSteward(author, anchor, relay)
    .then(res => console.log(JSON.stringify(res, null, 2)));
}
