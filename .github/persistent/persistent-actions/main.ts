import { WebClient, WebAPICallResult } from "@slack/web-api/dist/WebClient";
import { ConversationsHistoryArguments } from "@slack/web-api/dist/methods";
import { existsSync, writeFileSync, readFileSync } from "fs";
import getTime from "date-fns/get_time";
import subMinutes = require("date-fns/sub_minutes");

const token = process.env.SLACK_TOKEN;
const channel = process.env.SLACK_CHANNEL;

if (token === undefined || channel === undefined) {
  console.error("env: SLACK_TOKEN or SLACK_CHANNEL no exist.");
  process.exit(1);
}

function timestamp() {
  const date = subMinutes(new Date(), 30);
  const y = date.getFullYear();
  const mo = date.getMonth();
  const d = date.getDate();
  const h = date.getHours();
  const mi = date.getMinutes();
  return getTime(new Date(y, mo, d, h, mi, 0));
}

const ts = timestamp().toString();
const oldest = ts.substr(0, ts.length - 3);
console.log(">= timestamp: ", oldest);

const web = new WebClient(token);
console.log("start web.");
const options: ConversationsHistoryArguments = { channel: channel!, oldest, limit: 100 };

interface WithMessagesResult extends WebAPICallResult {
  messages?: { subtype: string, text: string }[]
}

async function collectHistoryMessage(msgs: string[], options: ConversationsHistoryArguments) {
  const h: WithMessagesResult = await web.conversations.history(options);
  if (!h.ok) return;
  if (h.messages!.length === 0) return;
  const ms = h.messages!.filter(m => m.subtype === "bot_message");
  if (ms.length === 0) return;
  ms.forEach(m => msgs.push(m.text));
  if (h.has_more) {
    options["cursor"] = h.response_metadata!.next_cursor;
    try {
      await collectHistoryMessage(msgs, options);
    } catch (e) {
      console.log(e.messages);
    }
  }
}

async function storeActions(client: any) {
  const clientFile = client.base.uid;
  if (!existsSync(clientFile)) {
    writeFileSync(clientFile, '{"actions":{}}', { encoding: "utf-8" });
  }
  const clientPersistentActions = JSON.parse(
    readFileSync(clientFile, { encoding: "utf-8" })
  );
  if (!clientPersistentActions["base"]) {
    clientPersistentActions["base"] = client.base;
  }
  for (const action of Object.keys(client.actions)) {
    const cnt =
      clientPersistentActions.actions[action] !== undefined
        ? clientPersistentActions.actions[action] + client.actions[action]
        : client.actions[action];
    clientPersistentActions.actions[action] = cnt;
  }
  writeFileSync(clientFile, JSON.stringify(clientPersistentActions), {
    encoding: "utf-8"
  });
}

export default async function main() {
  const messages: string[] = [];
  await collectHistoryMessage(messages, options);
  console.log(`messages number ${messages.length}`);
  for (const msg of messages) {
    const client = JSON.parse(msg);
    await storeActions(client);
  }
}
