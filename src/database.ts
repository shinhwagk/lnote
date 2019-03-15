import * as path from 'path';
import { readdirSync, statSync, pathExistsSync, existsSync, moveSync, mkdirsSync } from 'fs-extra';
import * as objectPath from 'object-path';
import { vpath, vfs, tools } from './helper';
import { noNoteDirs } from './constants';
import { randomBytes } from 'crypto';

const noteNameRegex = /^[0-9]\.[a-z]+$/;

export interface Domain {
    '.notes': string[];
    [domain: string]: string[] | Domain;
}

export namespace DBCxt {
    export let dbDirPath: string;
    export let domainCache: Domain;
}

export async function initializeDBVariables(dbDirPath: string): Promise<void> {
    DBCxt.dbDirPath = dbDirPath;
    DBCxt.domainCache = await refreshDomainCache();
}

export async function initializeDatabase(dbDirPath: string): Promise<void> {
    if (!existsSync(dbDirPath)) {
        vfs.mkdirsSync(dbDirPath);
        await createExampleData(dbDirPath);
    }
    await initializeDBVariables(dbDirPath);
}

export async function refreshDomainCache(): Promise<Domain> {
    const cacheTags: Domain = { '.notes': [] };
    for (const id of readdirSync(DBCxt.dbDirPath).filter(f => !(noNoteDirs.filter(nn => nn === f).length))) {
        const noteMetaFile = path.join(DBCxt.dbDirPath, id, '.n.yml');
        const noteMeta = vfs.readYamlSync(noteMetaFile);
        const tags = noteMeta['tags'];
        for (const tag of tags) {
            const t: string = tag['tag'];
            const sp = vpath.splitPath(vpath.join(t, '.notes'));
            objectPath.ensureExists(cacheTags, sp, []);
            const notes: string[] = objectPath.get<string[]>(cacheTags, sp, []);
            notes.push(id);
            objectPath.set(cacheTags, sp, notes);
        }
    }
    return cacheTags;
}

export async function selectAllNotesUnderDomain(domain: Domain): Promise<string[]> {
    const childDomainNames: string[] = Object.keys(domain).filter(name => name !== '.notes');
    const notes: string[] = domain['.notes'] || [];
    if (childDomainNames.length === 0) return notes;
    const total: string[] = [];
    for (const name of childDomainNames) {
        const childDomain: Domain = domain[name] as Domain;
        const childDomainNotes: string[] = await selectAllNotesUnderDomain(childDomain);
        total.push(...childDomainNotes);
    }
    return total.concat(notes);
}

export function selectDocReadmeFile(nId: string): string {
    const indexFile = readdirSync(path.join(DBCxt.dbDirPath, nId, 'doc'))
        .filter(f => /^README\.*/.test(f))[0];
    return path.join(DBCxt.dbDirPath, nId, 'doc', indexFile);
}

export function selectDocExist(nId: string): boolean {
    const docDir = path.join(DBCxt.dbDirPath, nId, 'doc');
    return existsSync(path.join(docDir, 'README.md')) ||
        existsSync(path.join(docDir, 'README.html')) ||
        existsSync(path.join(docDir, 'README.htm'));
}

export function selectFilesExist(nId: string): boolean {
    const filesDirPath = path.join(DBCxt.dbDirPath, nId, 'files');
    return pathExistsSync(filesDirPath);
}

export async function selectDomain(dpath: string[]): Promise<Domain> {
    return objectPath.get(DBCxt.domainCache, dpath);
}

export async function selectDomainNotes(dpath: string[]): Promise<string[]> {
    return objectPath.get(DBCxt.domainCache, dpath, { '.notes': [] })[".notes"];
}

export async function selectNoteContent(id: string): Promise<string[]> {
    const notePath = path.join(DBCxt.dbDirPath, id);
    const contents = readdirSync(notePath)
        .filter(f => noteNameRegex.test(f))
        .map(n => path.join(notePath, n))
        .filter(f => statSync(f).isFile)
        .map(f => vfs.readFileSync(f));
    return contents;
}

function genNewSeq(): string {
    const id = randomBytes(3).toString('hex');
    return existsSync(getNotePath(id)) ? genNewSeq() : id;
}

export async function createNode(dpath: string[], category: string = 'default'): Promise<string> {
    const newId = genNewSeq();
    const newNoteMetaFile = path.join(DBCxt.dbDirPath, newId, '.n.yml');
    const newNoteOneFIle = path.join(DBCxt.dbDirPath, newId, '1.txt');
    vfs.writeYamlSync(newNoteMetaFile, { tags: [{ tag: dpath.join('/'), category }] });
    vfs.writeFileSync(newNoteOneFIle, '');
    DBCxt.domainCache = await refreshDomainCache();
    return newId;
}

export async function createNodeCol(nid: string): Promise<number> {
    const notePath = path.join(DBCxt.dbDirPath, nid);
    const cnt = readdirSync(notePath).filter(f => /[1-9]+.*/.test(f)).length + 1;
    vfs.writeFileSync(path.join(notePath, `${cnt}.txt`), '');
    return cnt;
}

export async function createDomain(dpath: string[], name: string): Promise<void> {
    const oPath = dpath.concat(name);
    if (objectPath.has(DBCxt.domainCache, oPath)) return;
    objectPath.set(DBCxt.domainCache, oPath, {});
}

export async function resetNoteTags(dpath: string[], newName: string): Promise<void> {
    const opath = dpath.slice();
    const domain = await selectDomain(dpath);
    opath[opath.length - 1] = newName;
    const notes = await selectAllNotesUnderDomain(domain);
    for (const id of notes) {
        await resetNoteTag(id, dpath, opath);
    }
}

export const getNotePath = (id: string) => path.join(DBCxt.dbDirPath, id);

export const getTrashNotePath = (id: string) => path.join(DBCxt.dbDirPath, 'trash', id);

export const getNoteMetaFile = (id: string) => path.join(getNotePath(id), '.n.yml');

export async function resetNoteTag(id: string, oldPreTag: string[], newPreTag: string[]): Promise<void> {
    const noteMetaFile = getNoteMetaFile(id);
    const noteMeta = vfs.readYamlSync(noteMetaFile);
    const replaceLength = oldPreTag.length;
    for (let i = 0; i < noteMeta['tags'].length; i++) {
        const noteTag: string[] = noteMeta["tags"][i]["tag"].split('/').filter((s: string) => !!s);
        const preTag = noteTag.slice(0, oldPreTag.length);
        if (tools.arraysEqual(preTag, oldPreTag)) {
            noteTag.splice(0, replaceLength, ...newPreTag);
            noteMeta["tags"][i]["tag"] = noteTag.join("/");
        }
    }
    vfs.writeYamlSync(noteMetaFile, noteMeta);
}

export async function deleteNote(noteId: string): Promise<void> {
    const trashDir = path.join(DBCxt.dbDirPath, 'trash');
    if (!existsSync(trashDir)) { mkdirsSync(trashDir); }
    const notePath = getNotePath(noteId);
    const trashNotePath = getTrashNotePath(noteId);
    moveSync(notePath, trashNotePath);
}

async function createExampleData(dbDirPath: string): Promise<void> {
    const notePath: string = path.join(dbDirPath, '1');
    vfs.mkdirsSync(notePath);
    vfs.writeFileSync(path.join(notePath, '1.txt'), 'windows');
    vfs.writeFileSync(path.join(notePath, '2.txt'), 'chose install powershell');
    vfs.writeFileSync(
        path.join(notePath, '.n.yml'),
        'tags:\n    - tag: /powershell/install\n      category: install'
    );
    vfs.mkdirsSync(path.join(notePath, 'doc'));
    vfs.writeFileSync(path.join(notePath, 'doc', 'README.md'), 'example.');
    vfs.mkdirsSync(path.join(notePath, 'files'));
    vfs.writeFileSync(path.join(notePath, 'files', 'example_01.txt'), 'example 01.');
    vfs.writeFileSync(path.join(notePath, 'files', 'example_02.txt'), 'example 02.');
}
