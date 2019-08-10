const fs = require('fs'),
    { homedir } = require('os'),
    path = require('path');

const clientHome = path.join(homedir(), '.vscode-note');
const clientVersionFile = path.join(clientHome, 'version');

fs.existsSync(clientVersionFile) && fs.unlinkSync(clientVersionFile);
