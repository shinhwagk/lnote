import { WebClient, WebAPICallResult } from '@slack/web-api/dist/WebClient';
import { ConversationsHistoryArguments } from '@slack/web-api/dist/methods';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import getTime from 'date-fns/get_time';
import subMinutes from 'date-fns/sub_minutes';
import subSeconds from 'date-fns/sub_seconds';
import addMinutes from 'date-fns/add_minutes';
import addSeconds from 'date-fns/add_seconds';
import isPast from 'date-fns/is_past';
import toDate from 'date-fns/parse';
import dateFormat from 'date-fns/format';
import { join } from 'path';

namespace ARGS {
    export const delayTime = Number(process.env.DELAY_TIME || '5'); // minute
    export const statRange = Number(process.env.STAT_RANGE || '10'); // minute; !!! that must less than github actions schedule.
    export const clientsPath = 'clients';
    export const statTimestampFile = 'statistics-date';
    export const lastStatTime: Date = readStatTimestamp();

    // slack parameter
    export const latestDate = subSeconds(addMinutes(lastStatTime, statRange), 1);
    export const oldestDate = lastStatTime;
    //
    export const activeStatTime = addMinutes(latestDate, delayTime);
    export const isActiveStat = isPast(activeStatTime);
}

namespace SLACK_OPTIONS {
    export const latest = (getTime(ARGS.latestDate) / 1000).toString();
    export const oldest = (getTime(ARGS.oldestDate) / 1000).toString();
    export const limit = 100;
    export const token = process.env.SLACK_TOKEN;
    export const channel = process.env.SLACK_CHANNEL;
    export const isOK = !!token && !!channel;
}

function readStatTimestamp(): Date {
    if (!existsSync(ARGS.statTimestampFile)) {
        let cDate = new Date();
        cDate.setMilliseconds(0);
        cDate.setSeconds(0);
        cDate = subMinutes(cDate, ARGS.delayTime + ARGS.statRange + 10);
        while (true) {
            cDate = addMinutes(cDate, 1);
            if (cDate.getMinutes() % 10 === 0) break;
        }
        writeFileSync(ARGS.statTimestampFile, dateFormat(cDate, 'YYYY-MM-DDTHH:mm:ss'), { encoding: 'utf-8' });
        return cDate;
    }
    return toDate(readFileSync(ARGS.statTimestampFile, { encoding: 'utf-8' }));
}
function persistentStatDate() {
    writeFileSync(ARGS.statTimestampFile, dateFormat(addSeconds(ARGS.latestDate, 1), 'YYYY-MM-DDTHH:mm:ss'), {
        encoding: 'utf-8',
    });
}

interface WithMessagesResult extends WebAPICallResult {
    messages?: { subtype: string; text: string }[];
}

async function collectHistoryMessage(web: WebClient, msgs: string[], options: ConversationsHistoryArguments) {
    const h: WithMessagesResult = await web.conversations.history(options);
    if (!h.ok) return;
    if (h.messages!.length === 0) return;
    const ms = h.messages!.filter(m => m.subtype === 'bot_message');
    if (ms.length === 0) return;
    ms.forEach(m => msgs.push(m.text));
    if (!h.has_more) return;
    options['cursor'] = h.response_metadata!.next_cursor;
    try {
        await collectHistoryMessage(web, msgs, options);
    } catch (e) {
        specialConsoleLog(e.messages);
    }
}

async function storeActions(client: any) {
    const clientFile = join(ARGS.clientsPath, client.base.uid);
    if (!existsSync(clientFile)) {
        writeFileSync(clientFile, '{"actions":{}}', { encoding: 'utf-8' });
    }
    const clientPersistentActions = JSON.parse(readFileSync(clientFile, { encoding: 'utf-8' }));
    if (!clientPersistentActions['base']) {
        clientPersistentActions['base'] = client.base;
    }
    clientPersistentActions['version'] = client.version;
    for (const action of Object.keys(client.actions)) {
        const cnt =
            clientPersistentActions.actions[action] !== undefined
                ? clientPersistentActions.actions[action] + client.actions[action]
                : client.actions[action];
        clientPersistentActions.actions[action] = cnt;
    }
    writeFileSync(clientFile, JSON.stringify(clientPersistentActions), {
        encoding: 'utf-8',
    });
}

function printStatRange() {
    const startDate = dateFormat(ARGS.oldestDate, 'YYYY-MM-DDTHH:mm:ss');
    const endDate = dateFormat(ARGS.latestDate, 'YYYY-MM-DDTHH:mm:ss');
    specialConsoleLog(`statistics range: ${startDate} - ${endDate}.`);
}

function specialConsoleLog(log: string) {
    const special = Array.from({ length: log.length })
        .map(() => '#')
        .join('');
    console.log(`##${special}##`);
    console.log(`# ${log} #`);
    console.log(`##${special}##`);
}

function printClientNumber(messages: string[]) {
    const c = new Set(messages.map(m => JSON.parse(m)).map(ca => ca.base.uid));
    specialConsoleLog(`update clients number: ${c.size}`);
}

export default async function main() {
    printStatRange();
    if (!ARGS.isActiveStat) {
        specialConsoleLog('not active.');
        process.exit(0);
    }

    if (!SLACK_OPTIONS.isOK) {
        specialConsoleLog('env: SLACK_TOKEN or SLACK_CHANNEL no set.');
        process.exit(1);
    }

    persistentStatDate();

    const messages: string[] = [];
    const webClient = new WebClient(SLACK_OPTIONS.token!);
    const options: ConversationsHistoryArguments = {
        channel: SLACK_OPTIONS.channel!,
        latest: SLACK_OPTIONS.latest,
        oldest: SLACK_OPTIONS.oldest,
        limit: 100,
    };
    await collectHistoryMessage(webClient, messages, options);

    for (const clientActions of messages.map(m => JSON.parse(m))) {
        await storeActions(clientActions);
    }

    printClientNumber(messages);
}
