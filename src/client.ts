import * as https from 'https';
import { tools } from './helper';
import { homedir, platform, release, type, hostname, arch } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, readdirSync, removeSync } from 'fs-extra';
import { version as lastVersion } from '../package.json';
import compareVersions from 'compare-versions';

type ActionTimestamp = number;
type OSInfo = { [attr: string]: string };
type Actions = { [action: string]: ActionTimestamp[] };

function currentTime() {
    return new Date().getTime();
}

type ActionsBody = { cid: string; action: string; timestamp: number; version: string };

type ClientInfoBody = { cid: string; info: OSInfo; timestamp: number; version: string };

function genClientId() {
    return tools.hexRandom(10);
}

const getActions = () => (existsSync(ClientFiles.actions) ? vfs.readJsonSync<Actions>(ClientFiles.actions) : {});

const getClientId = () => (existsSync(ClientFiles.id) ? vfs.readFileSync(ClientFiles.id) : genClientId());

const getOldVersion = () => (existsSync(ClientFiles.version) ? vfs.readFileSync(ClientFiles.version) : '0.0.0');

const setOldVersion = (v: string) => vfs.writeFileSync(ClientFiles.version, v);

const stageActions = (actions: Actions) => vfs.writeJsonSync(ClientFiles.actions, actions);

function getOSInfo() {
    return { type: type(), platform: platform(), release: release(), hostname: hostname(), arch: arch() };
}

function versionUpgrade(upgradeScriptsPath: string) {
    const oldVersion: string = getOldVersion();
    if (compareVersions(lastVersion, oldVersion) === 0) return;
    const patchs = readdirSync(upgradeScriptsPath)
        .map(name => name.substr(0, name.length - 3))
        .filter(patch => compareVersions(patch, oldVersion) === 1)
        .filter(patch => compareVersions(patch, lastVersion) <= 0)
        .sort(compareVersions)
        .map(v => v + '.js');
    for (const patch of patchs) {
        console.log(join(upgradeScriptsPath, patch));
        eval(vfs.readFileSync(join(upgradeScriptsPath, patch)));
        console.log(`use upgrade script: ${patch}.js`);
    }
    setOldVersion(lastVersion);
    console.log(`update from ${oldVersion} -> ${lastVersion}`);
}

const postSlack = (body: ClientInfoBody | ActionsBody) => {
    const b: string = JSON.stringify({ text: JSON.stringify(body) });
    return new Promise<string>((resolve, reject) => {
        const options: https.RequestOptions = {
            host: 'hooks.slack.com',
            path: '/services/THAUWRE2W/BJACQ46CX/vmUGK9qnTQDRNtxETMwavscn',
            method: 'POST',
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        };

        const req = https.request(options, res => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => (chunk += data));
            res.on('end', () => resolve(data));
            res.on('error', err => reject(err.message));
        });

        req.on('error', err => reject(err.message));
        req.write(b);
        req.end();
    });
};

function makePostActionsBody(action: string, timestamp: number): ActionsBody {
    return { action, timestamp, cid: getClientId(), version: lastVersion };
}

function makePostClientInfoBody(timestamp: number): ClientInfoBody {
    return { cid: getClientId(), info: getOSInfo(), timestamp, version: lastVersion };
}

async function sendClientActions(action: string) {
    const actions = getActions();
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
        removeSync(ClientFiles.actions);
    } catch (e) {
        stageActions(actions);
    }
}

// client file variable
namespace ClientFiles {
    export const home = join(homedir(), '.vscode-note');
    export const id = join(home, 'clientId');
    export const version = join(home, 'version');
    export const actions = join(home, 'actions');
}

export function initClient(extonionPath: string) {
    const upgradeScriptsPath = join(extonionPath, 'upgrade');
    versionUpgrade(upgradeScriptsPath);
    sendClientActions('active');
    return (action: string) => sendClientActions(action);
}
