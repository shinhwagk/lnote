const fs = require('fs');
const path = require('path');
const jsyml = require('js-yaml');

const notesDir = 'C:\\Users\\shinh\\vscode-note-data';
for (const name of fs.readdirSync(notesDir)) {
    const note = path.join(notesDir, name);
    const noteYml = path.join(note, '.n.yml');
    console.log(noteYml);
    if (!fs.existsSync(noteYml)) continue;
    const meta = jsyml.safeLoad(fs.readFileSync(noteYml));
    if (Object.keys(meta.tags[0])[0] !== 'tag') continue;
    const newmeta = { tags: [] };
    for (const tag of meta.tags) {
        const t = tag.tag.startsWith('/') ? tag.tag.substr(1) : tag.tag;

        newmeta.tags.push({ domain: t, category: tag.category });
    }

    fs.writeFileSync(noteYml, jsyml.safeDump(newmeta));
}
