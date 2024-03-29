const fs = require('fs');
const path = require('path');

const nbsdir = 'F:\\vscode-note\\lnote-data-20221010\\lnote-data-20221010';

// for (const nb of fs.readdirSync(nbsdir)) {
//     const nbdir = path.join(nbsdir, nb)
//     if (fs.statSync(nbdir).isDirectory()) {
//         const notesfile = path.join(nbdir, 'notes.json')
//         const notes = JSON.parse(fs.readFileSync(notesfile, { encoding: 'utf-8' }))
//         for (const [id, data] of Object.entries(notes)) {
//             notes[id].labels = { common: data.labels }
//         }
//         fs.writeFileSync(notesfile, JSON.stringify(notes), { encoding: 'utf-8' })
//         console.log(`nb notes: ${nb} success.`)
//     }
// }
const domainBackupFile = 'domain-backup.json'
const notesBackupFile = 'notes-backup.json'

for (const nb of fs.readdirSync(nbsdir)) {
    const nbdir = path.join(nbsdir, nb)
    if (fs.statSync(nbdir).isDirectory()) {
        const domainfile = path.join(nbdir, 'domains.json')
        const domain = JSON.parse(fs.readFileSync(domainfile, { encoding: 'utf-8' }))

        processDomain(domain)
        fs.writeFileSync(domainfile, JSON.stringify(domain), { encoding: 'utf-8' })
        console.log(`nb domain: ${nb} success.`)
        // for (const [id, data] of Object.entries(notes)) {
        //     notes[id].labels = { common: data.labels }
        // }
        // fs.writeFileSync(notesfile, JSON.stringify(notes), { encoding: 'utf-8' })
        // console.log(`nb: ${nb} success.`)
    }
}


function processDomain(domain) {
    for (const [name, d] of Object.entries(domain)) {

        if (name === '.labels') {
            domain['.labels'] = { common: domain['.labels'] }
        } else {
            processDomain(d)
        }

    }

}