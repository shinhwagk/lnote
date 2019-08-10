const fs = require('fs');
const path = require('path');
const jsyml = require('js-yaml');

const notesDir = 'D:\\OneDrive\\vscode-note-data\\notes';

for (const name of fs.readdirSync(notesDir)) {
    const note = path.join(notesDir, name);
    const noteYml = path.join(note, '.n.yml');
    const noteJson = path.join(note, '.n.json');
    if (!fs.existsSync(noteYml)) {
        continue;
    }
    const meta = jsyml.safeLoad(fs.readFileSync(noteYml));
    fs.writeFileSync(noteJson, JSON.stringify(meta), { encoding: 'utf-8' });
    fs.unlinkSync(noteYml);
    console.log(`${noteYml} - to ${noteJson}`);
}
