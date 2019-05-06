import { WebClient, WebAPICallResult } from '@slack/web-api/dist/WebClient';
import { ConversationsHistoryArguments } from '@slack/web-api/dist/methods';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import getTime from 'date-fns/get_time';
import subSeconds from 'date-fns/sub_seconds';
import addMinutes from 'date-fns/add_minutes';
import addSeconds from 'date-fns/add_seconds';
import isPast from 'date-fns/is_past';
import toDate from 'date-fns/parse';
import dateFormat from 'date-fns/format';
import { join } from 'path';
import { randomBytes } from 'crypto';

namespace ARGS {
    export const startDate = '2019-04-06T00:00:00';
    export const storagePath = 'storage2file';
    export const storageTimestampFile = join(storagePath, 'timestamp');
    export const storageRange = process.env.STORAGE_RANGE ? Number(process.env.RANGE) : 60; // minute
    export const storageDelay = process.env.STORAGE_DELAY ? Number(process.env.DELAY) : 10; // minute
    export const limit = 100;

    export const SlackToken = process.env.SLACK_TOKEN;
    export const SlackChannel = process.env.SLACK_CHANNEL;

    const isOK = !!SlackToken && !!SlackChannel;
    if (!isOK) {
        specialConsoleLog('env: SLACK_TOKEN or SLACK_CHANNEL or FIREBASE_FUNCSTIONS_URL no set.');
        process.exit(1);
    }
}

class StorageClientMessage {
    private readonly lastStorageTime: Date = readStorageTimestamp();
    private readonly latestDate = subSeconds(addMinutes(this.lastStorageTime, ARGS.storageRange), 1);
    private readonly oldestDate = this.lastStorageTime;
    private readonly activeStatTime = addMinutes(this.latestDate, ARGS.storageDelay);
    private readonly isActiveStat = isPast(this.activeStatTime);
    private readonly tsMessages: string[] = [];

    constructor(private readonly webClient: WebClient) {}

    async start(): Promise<number> {
        if (!this.isActiveStat) {
            return 0;
        }

        const latest = (getTime(this.latestDate) / 1000).toString();
        const oldest = (getTime(this.oldestDate) / 1000).toString();
        const options: ConversationsHistoryArguments = {
            channel: ARGS.SlackChannel!,
            latest: latest,
            oldest: oldest,
            limit: ARGS.limit,
        };
        await pullSlackMessage(this.webClient, this.tsMessages, options);

        for (const data of this.tsMessages) {
            await push2File(data);
            await cushionSleepSeconds(0.1);
        }
        this.printStatRange();
        this.printTSNumber();
        saveSorageTimestamp(addSeconds(this.latestDate, 1));
        return 1;
    }

    printStatRange() {
        const startDate = dateFormat(this.oldestDate, 'YYYY-MM-DDTHH:mm:ss');
        const endDate = dateFormat(this.latestDate, 'YYYY-MM-DDTHH:mm:ss');
        specialConsoleLog(`storage range: ${startDate} - ${endDate}.`);
    }

    printTSNumber() {
        specialConsoleLog(`update clients number: ${this.tsMessages.length}`);
    }
}

function cushionSleepSeconds(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

function readStorageTimestamp(): Date {
    if (!existsSync(ARGS.storagePath)) {
        mkdirSync(ARGS.storagePath);
    }
    if (!existsSync(ARGS.storageTimestampFile)) {
        const startDate = toDate(ARGS.startDate);
        saveSorageTimestamp(startDate);
        return startDate;
    }
    return toDate(readFileSync(ARGS.storageTimestampFile, { encoding: 'utf-8' }));
}

function saveSorageTimestamp(date: Date) {
    writeFileSync(ARGS.storageTimestampFile, dateFormat(date, 'YYYY-MM-DDTHH:mm:ss'), { encoding: 'utf-8' });
}

interface WithMessagesResult extends WebAPICallResult {
    messages?: { subtype: string; text: string }[];
}

async function pullSlackMessage(web: WebClient, msgs: string[], options: ConversationsHistoryArguments) {
    const h: WithMessagesResult = await web.conversations.history(options);
    if (!h.ok) return;
    if (h.messages!.length === 0) return;
    const ms = h.messages!.filter(m => m.subtype === 'bot_message');
    if (ms.length === 0) return;
    ms.forEach(m => msgs.push(m.text));
    if (!h.has_more) return;
    options['cursor'] = h.response_metadata!.next_cursor;
    try {
        await pullSlackMessage(web, msgs, options);
    } catch (e) {
        specialConsoleLog(e.messages);
    }
}
const push2File = (body: string) => {
    const docId = randomBytes(10).toString('hex');
    const docFile = join(ARGS.storagePath, docId);
    writeFileSync(docFile, body, { encoding: 'utf-8' });
};

function specialConsoleLog(log: string) {
    const special = Array.from({ length: log.length })
        .map(() => '#')
        .join('');
    console.log(`##${special}##`);
    console.log(`# ${log} #`);
    console.log(`##${special}##`);
}

export default async function main() {
    specialConsoleLog('start storage ts.');
    const slackWC = new WebClient(ARGS.SlackToken!);

    let stop = 1;
    while (stop) {
        const sts = new StorageClientMessage(slackWC);
        stop = await sts.start();
    }
    specialConsoleLog('end storage ts.');
}
