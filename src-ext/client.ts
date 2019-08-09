import { tools } from './helper';
import { IPersistence } from './moduls/IPersistence';
import { post as httpPost } from 'got';

type ActionTimestamp = number;
type Actions = { [action: string]: ActionTimestamp[] };

function genClientId(): string {
    return tools.hexRandom(10);
}

export function sendGA(ec: string, ea: string) {
    const tid = 'UA-143144958-1';
    const t = 'event';
    const v = 1;
    const uid = state.clientId;
    const cid = genClientId();
    const form = true;
    const body = { v, tid, uid, t, ec, ea, cid };
    return httpPost('https://www.google-analytics.com/collect', { body, form });
}

namespace state {
    export let clientId: string;
    export let actionsPersis: IPersistence<Actions>;
    export let activePersis: IPersistence<number>;
}

export function init(clientPersis: IPersistence<string>) {
    const checkClientId: string | undefined = clientPersis.get();
    if (!checkClientId) {
        clientPersis.update(genClientId());
    }
    state.clientId = checkClientId!;
}
