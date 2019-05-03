const fs = require('fs'),
    path = require('path');

const clientHome = path.join(homedir(), '.vscode-note');
const clientVersionFile = path.join(clientHome, 'version');

fs.existsSync(clientVersionFile) && fs.unlink(clientVersionFile);
