import * as https from 'https';
import { tools } from './helper';
import { homedir, platform, release, type, hostname, arch } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, readdirSync } from 'fs-extra';
import { version } from '../package.json';
import compareVersions from 'compare-versions';

type ActionTimestamp = number;
type OSInfo = { [attr: string]: string };
type Actions = { [action: string]: ActionTimestamp[] };

interface VScodeNoteClient {
    id: string;
    version: string;
    info?: OSInfo;
    actions: Actions;
    first: number;
}

function currentTime() {
    return new Date().getTime();
}

const clientFile = join(homedir(), '.vscode-note');

type ActionsBody = { cid: string; actions: Actions };

type OSInfoBody = { cid: string; info: OSInfo };

function genClientId() {
    return tools.hexRandom(10);
}

function initVScodeNoteClient(): VScodeNoteClient {
    if (!existsSync(clientFile)) {
        return {
            id: genClientId(),
            version: version,
            info: ClientInfo.info,
            actions: {},
            first: currentTime(),
        };
    }
    return vfs.readJsonSync<VScodeNoteClient>(clientFile);
}

function versionUpgrade(last: string) {
    const old = vscodeNoteClient.version;
    if (old === last) return;
    let patchs = readdirSync('../upgrade')
        .map(name => name.substr(0, name.length - 4))
        .filter(patch => compareVersions(patch, old))
        .filter(patch => !compareVersions(patch, last))
        .map(name => name + '.js');
    patchs = patchs.sort(compareVersions);
    patchs.forEach(require);
    vscodeNoteClient.version = last;
}

const postSlack = (body: OSInfoBody | ActionsBody) => {
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

namespace ClientInfo {
    export const info = { type: type(), platform: platform(), release: release(), hostname: hostname(), arch: arch() };
}

function makePostActionsBody(actions: Actions): ActionsBody {
    return { actions: actions, cid: vscodeNoteClient.id };
}

async function sendClientActions(action: string) {
    if (vscodeNoteClient.actions[action]) {
        vscodeNoteClient.actions[action].push(currentTime());
    } else {
        vscodeNoteClient.actions[action] = [currentTime()];
    }
    await postSlack(makePostActionsBody(vscodeNoteClient.actions));
    vscodeNoteClient.actions = {};
    vfs.writeJsonSync(clientFile, vscodeNoteClient);
}

async function sendClientInfo(info: OSInfo) {
    await postSlack({ cid: vscodeNoteClient.id, info });
    delete vscodeNoteClient.info;
    vfs.writeJsonSync(clientFile, vscodeNoteClient);
}

const vscodeNoteClient: VScodeNoteClient = initVScodeNoteClient();
function _init() {
    versionUpgrade(version);
    vscodeNoteClient.info && sendClientInfo(vscodeNoteClient.info);
    sendClientActions('active');
}

export function initClient() {
    _init();
    return (action: string) => sendClientActions(action);
}
