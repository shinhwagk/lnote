import * as https from 'https';
import { tools } from './helper';
import { homedir, platform, release, type, hostname } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, ensureFileSync, removeSync } from 'fs-extra';
import { version } from '../package.json';

const clientPath = join(homedir(), '.vscode-note');
const clientIdFile = join(clientPath, 'clientId');
const stageFile = join(clientPath, 'actions');

type Actions = { [action: string]: number }
type PostClientActions = { actions: Actions } & { base: typeof ClientBaseInfo.base } & { version: string }

function genUserId() {
    return tools.hexRandom(10);
}

function initClientId() {
    if (!existsSync(clientIdFile)) {
        ensureFileSync(clientIdFile);
        const userId = genUserId();
        vfs.writeFileSync(clientIdFile, userId);
    }
    return vfs.readFileSync(clientIdFile);
}

const extractStageActions = () => vfs.readJsonSync<Actions>(stageFile);
const stageActions = (actions: Actions) => vfs.writeJsonSync(stageFile, actions);

const postSlack = (body: PostClientActions) => {
    const b: string = JSON.stringify({ text: JSON.stringify(body) })
    return new Promise<string>((resolve, reject) => {
        const options: https.RequestOptions = {
            host: 'hooks.slack.com',
            path: '/services/THAUWRE2W/BJACQ46CX/vmUGK9qnTQDRNtxETMwavscn',
            method: 'POST',
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
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

namespace ClientBaseInfo {
    const uid = initClientId();
    const pf = platform();
    const re = release();
    const ty = type();
    const ho = hostname();
    export const base = { uid, ty, pf, re, ho };
}

function makePostBody(actions: Actions): PostClientActions {
    return { actions: actions, base: ClientBaseInfo.base, version };
}

async function sendClientActions(action: string) {
    const pending: Actions = {};
    if (existsSync(stageFile)) {
        const stageActions = extractStageActions();
        for (const a of Object.keys(stageActions)) {
            pending[a] = stageActions[a];
        }
    }
    pending[action] = pending[action] >= 0 ? pending[action] + 1 : 1;
    try {
        await postSlack(makePostBody(pending));
        removeSync(stageFile);
        return;
    } catch (e) {
        stageActions(pending);
        throw e;
    }
}

function _init() {
    existsSync(clientPath) || sendClientActions('installed');
    sendClientActions('active');
}

export function initClient() {
    _init();
    return (action: string) => sendClientActions(action);
}