const fs = require('fs');

const notesDir = process.argv[2];

for (const i of fs.readdirSync(notesDir)) {
    console.log(i);
    const snm = JSON.parse(fs.readFileSync(`${notesDir}/${i}/.n.json`));
    console.log(snm);
    if (snm['domain'] === undefined) {
        fs.writeFileSync(`${notesDir}/${i}/.n.json`, JSON.stringify(snm['tags'][0]));
    }
}
