const fs = require('fs');
const path = require('path');

const nbsdir = '/Users/shinhwagk/OneDrive/vscode-note-data/lnote-data-20230503';

for (const nb of fs.readdirSync(nbsdir)) {
    const nbdir = path.join(nbsdir, nb);
    if (fs.statSync(nbdir).isDirectory() && !nbdir.startsWith('.')) {
        console.log(nb)
        const notesfile = path.join(nbdir, 'notes.json');
        const notes = JSON.parse(fs.readFileSync(notesfile, { encoding: 'utf-8' }));
        for (const [id, data] of Object.entries(notes)) {
            notes[id]['gls'] = { common: data.labels };
            delete notes[id]['labels']

        }
        fs.writeFileSync(notesfile, JSON.stringify(notes), { encoding: 'utf-8' });
        console.log(`nb notes: ${nb} success.`);
    }
}


for (const nb of fs.readdirSync(nbsdir)) {
    const nbdir = path.join(nbsdir, nb);
    if (fs.statSync(nbdir).isDirectory() && !nbdir.startsWith('.')) {
        const domainfile = path.join(nbdir, 'domains.json');
        const domain = JSON.parse(fs.readFileSync(domainfile, { encoding: 'utf-8' }));

        processDomain(nb, domain);
        fs.writeFileSync(domainfile, JSON.stringify(domain), { encoding: 'utf-8' });
        console.log(`nb domain: ${nb} success.`);
        // for (const [id, data] of Object.entries(notes)) {
        //     notes[id].labels = { common: data.labels }
        // }
        // fs.writeFileSync(notesfile, JSON.stringify(notes), { encoding: 'utf-8' })
        // console.log(`nb: ${nb} success.`)
    }
}


function processDomain(nb, domain) {
    for (const [name, d] of Object.entries(domain)) {

        if (name === '.labels') {
            domain['.gls'] = { common: domain['.labels'] };
            domain['.gls']['##nb'] = [nb]
            delete domain['.labels']
        } else {
            processDomain(nb, d);
        }

    }
}


for (const nb of fs.readdirSync(nbsdir)) {
    const nbdir = path.join(nbsdir, nb);
    if (fs.statSync(nbdir).isDirectory() && !nbdir.startsWith('.')) {
        const domainfile = path.join(nbdir, 'domains.json');
        const domain = JSON.parse(fs.readFileSync(domainfile, { encoding: 'utf-8' }));
        const d = {};
        d[nb] = domain
        fs.writeFileSync(domainfile, JSON.stringify(d), { encoding: 'utf-8' });
        console.log(`nb domain: ${nb} success.`);
    }
}