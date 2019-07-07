import { tools } from './helper';
import { platform, release, type, hostname, arch } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { readdirSync } from 'fs-extra';
import { version as lastVersion } from '../package.json';
import { eq, compare, lte, gt } from 'semver';
import { identifier } from './constants';
import addHours from 'date-fns/add_hours';
import isPast from 'date-fns/is_past';
import { IPersistence } from './moduls/IPersistence';
import got = require('got');

type ActionTimestamp = number;
type OSInfo = { [attr: string]: string };
type Actions = { [action: string]: ActionTimestamp[] };

function currentTime() {
    return new Date().getTime();
}

type ActionsBody = { cid: string; action: string; timestamp: number; version: string };

type ClientInfoBody = { cid: string; info: OSInfo; timestamp: number; version: string };

function genClientId(): string {
    return tools.hexRandom(10);
}

function doActive() {
    const activeTime = state.activePersis.get(currentTime());
    const nextActiveTime: Date = addHours(activeTime, 24);
    nextActiveTime.setHours(0, 0, 0, 0);
    if (isPast(nextActiveTime)) {
        sendClientActions('active');
        sendGA('active', lastVersion);
        state.activePersis.update(activeTime)
    }
}

const getPreviousVersion = (extonionsPath: string) => {
    const extonions = readdirSync(extonionsPath).filter(name => name.startsWith(identifier));
    if (extonions.length >= 2) {
        const versions = extonions.map(name => name.substr(identifier.length + 1)).sort(compare);
        return versions.slice(versions.length - 2)[0];
    } else {
        return lastVersion;
    }
};

const stageActions = (actions: Actions) => state.actionsPersis.update(actions);

function getOSInfo() {
    return { type: type(), platform: platform(), release: release(), hostname: hostname(), arch: arch() };
}

function versionUpgrade(extonionPath: string) {
    const upgradeScriptsPath = join(extonionPath, 'upgrade');
    const extonionsPath = join(extonionPath, '..');
    const preVersion: string = getPreviousVersion(extonionsPath);
    if (eq(lastVersion, preVersion)) return;
    const patchs = readdirSync(upgradeScriptsPath)
        .map(name => name.substr(0, name.length - 3))
        .filter(patch => gt(patch, preVersion))
        .filter(patch => lte(patch, lastVersion))
        .sort(compare)
        .map(v => v + '.js');
    for (const patch of patchs) {
        console.log(join(upgradeScriptsPath, patch));
        eval(vfs.readFileSync(join(upgradeScriptsPath, patch)));
        console.log(`use upgrade script: ${patch}.js`);
    }
    console.log(`update from ${preVersion} -> ${lastVersion}`);
}

const postSlack = (body: ClientInfoBody | ActionsBody) => {
    const b = { text: JSON.stringify(body) };
    got.post({
        host: 'hooks.slack.com', path: '/services/THAUWRE2W/BJACQ46CX/vmUGK9qnTQDRNtxETMwavscn',
        headers: { 'Content-Type': 'application/json' }
    }, { body: JSON.stringify(b) })
}


function makePostActionsBody(action: string, timestamp: number): ActionsBody {
    return { action, timestamp, cid: state.clientId, version: lastVersion };
}

function makePostClientInfoBody(timestamp: number): ClientInfoBody {
    return { cid: state.clientId, info: getOSInfo(), timestamp, version: lastVersion };
}

async function sendClientActions(action: string) {
    const actions = state.actionsPersis.get({});
    if (actions[action]) {
        actions[action].push(currentTime());
    } else {
        actions[action] = [currentTime()];
    }
    try {
        for (const [a, ts] of Object.entries(actions)) {
            if (a === 'installed') {
                await postSlack(makePostClientInfoBody(ts[0]));
                continue;
            }
            for (const t of ts) {
                await postSlack(makePostActionsBody(a, t));
            }
        }
        state.actionsPersis.update({});
    } catch (e) {
        stageActions(actions);
    }
}

export function initClient(extonionPath: string) {
    stageActions({ installed: [currentTime()] });
    versionUpgrade(extonionPath);
    doActive();
    return (action: string) => sendClientActions(action);
}

export function sendGA(ec: string, ea: string) {
    const tid = 'UA-143144958-1';
    const t = 'event';
    const v = 1;
    const uid = state.clientId
    const form = true
    const body = { v, tid, uid, t, ec, ea }
    return got.post('https://www.google-analytics.com/collect', { body, form })
}

namespace state {
    export let clientId: string;
    export let actionsPersis: IPersistence<Actions>;
    export let activePersis: IPersistence<number>;
}

export function init(clientPersis: IPersistence<string>, actionsPersis: IPersistence<Actions>, activePersis: IPersistence<number>) {
    const checkClientId = clientPersis.get()
    if (checkClientId) {
        state.clientId = checkClientId;
        return
    }
    state.clientId = genClientId()
    stageActions({ installed: [currentTime()] });

    state.actionsPersis = actionsPersis
    state.activePersis = activePersis
}
