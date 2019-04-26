const fs = require('fs');
const path = require('path');

function format(notesDir) {
    for (const name of fs.readdirSync(notesDir)) {
        const note = path.join(notesDir, name);
        const noteMeta = path.join(note, '.n.json');
        if (!fs.existsSync(noteMeta)) {
            console.log(`no exist ${noteMeta}`);
            continue;
        }
        const meta = JSON.parse(fs.readFileSync(noteMeta));
        for (const tag of meta.tags) {
            tag.domain = tag.domain.split('/');
        }
        console.log(JSON.stringify(meta));

        fs.writeFileSync(noteMeta, JSON.stringify(meta));
    }
}

// replace your location.
const notesDir = 'D:\\OneDrive\\vscode-note-data\\notes';

format(notesDir);
