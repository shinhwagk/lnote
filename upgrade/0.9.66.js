const fs = require('fs'),
    { homedir } = require('os'),
    path = require('path');

const clientHome = path.join(homedir(), '.vscode-note');
const clientActionsFile = path.join(clientHome, 'actions');

if (fs.existsSync(clientActionsFile)) {
    const actions = JSON.parse(fs.readFileSync(clientActionsFile), { encoding: 'utf-8' }) || {};
    const timestamp = fs.statSync(actions).ctimeMs || new Date().getTime();
    const newActions = {};
    for (const action of Object.keys(actions)) {
        if (newActions[action] === undefined) {
            newActions[action] = [timestamp];
        }
    }
    fs.writeFileSync(clientActionsFile, JSON.stringify(newActions), { encoding: 'utf-8' });
}
