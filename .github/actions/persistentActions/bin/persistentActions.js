#!/usr/bin/env node

const { WebClient } = require("@slack/web-api");
const { existsSync, writeFileSync, readFileSync } = require("fs");
const { getTime } = require("date-fns/get_date");

const token = process.env.SLACK_TOKEN;
const channel = process.env.SLACK_CHANNEL;

if (!token || !channel) {
  console.error("env: token or channel no exist.");
  process.exit(1);
}

function timestamp() {
  const date = new Date();
  const y = date.getFullYear();
  const mo = date.getMonth();
  const d = date.getDate();
  const h = date.getHours();
  const mi = date.getMinutes();
  return getTime(new Date(y, mo, d, h, mi, 0, 000));
}

const oldest = `${timestamp()}`;

const web = new WebClient(token);
const options = { channel: channel, oldest, limit: 1 };

// interface SlackMessage {
//   type: "message";
//   text: string;
//   ts: string;
// }

// interface WithMessage extends WebAPICallResult {
//   messages?: SlackMessage[];
// }

// interface VscodeNoteClient {
//   actions: { [actions: string]: number };
//   base: {
//     uid: string;
//     ty: string;
//     pf: string;
//     re: string;
//     ho: string;
//     ve: string;
//   };
// }

async function collectHistoryMessage(msgs, options) {
  const h = await web.conversations.history(options);
  if (!h.ok) return;
  if (!h.messages) return;
  h.messages.forEach(m => msgs.push(m.text));
  const next_cursor = h.response_metadata.next_cursor;
  if (next_cursor) {
    options["cursor"] = next_cursor;
    await collectHistoryMessage(msgs, options);
  }
}

async function storeActions(client) {
  const uid = client.base.uid;
  if (!existsSync(uid)) {
    writeFileSync(uid, '{"actions":{}}', { encoding: "utf-8" });
  }
  const clientPersistentActions = JSON.parse(
    readFileSync(uid, { encoding: "utf-8" })
  );
  if (!clientPersistentActions["base"]) {
    clientPersistentActions["base"] = client.base;
  }
  for (const action of Object.keys(client.actions)) {
    const cnt =
      clientPersistentActions.actions[action] !== undefined
        ? clientPersistentActions.actions[action] + 1
        : 0;
    clientPersistentActions.actions[action] = cnt;
  }
  writeFileSync(uid, JSON.stringify(clientPersistentActions), {
    encoding: "utf-8"
  });
}

(async () => {
  const messages = [];
  await collectHistoryMessage(messages, options);
  for (const msg of messages) {
    const client = JSON.parse(msg);
    await storeActions(client);
  }
})();
