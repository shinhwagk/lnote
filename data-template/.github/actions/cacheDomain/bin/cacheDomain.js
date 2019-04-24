#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const objectPath = require('object-path');

const notesDir = 'notes';

const noteDir = (id) => path.join(notesDir, id);

const metaFile = (id) => path.join(noteDir(id), '.n.json');

const writeDomainCacheFile = (data) => fs.writeFileSync('./domain.cache', JSON.stringify(data, null, 2), { encoding: 'utf-8' });

const readMeta = (id) => JSON.parse(fs.readFileSync(metaFile(id), { encoding: 'utf-8' }));

function main() {
  const cache = {};
  for (const nId of fs.readdirSync(notesDir)) {
    if (!fs.existsSync(metaFile(nId))) continue;
    for (const tag of readMeta(nId).tags) {
      const dpath = tag.domain.split('/').filter(p => !!p);
      const domainNotesPath = dpath.concat('.notes');
      const orgNotes = objectPath.get(cache, domainNotesPath, []);
      objectPath.set(cache, domainNotesPath, Array.from(new Set(orgNotes.concat(nId))));
    }
  }
  writeDomainCacheFile(cache);
}

main();