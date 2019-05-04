const fs = require('fs'),
    { homedir } = require('os'),
    path = require('path');

const clientHome = path.join(homedir(), '.vscode-note');

if (fs.existsSync(clientHome)) {
    try {
        for (const f of fs.readdirSync(clientHome)) {
            const file = path.join(clientHome, f)
            if (fs.statSync(file).isFile) {
                fs.unlinkSync(file);
            }
        }
        fs.rmdirSync(clientHome)
    } catch (e) {
            console.log(e)
    }
}