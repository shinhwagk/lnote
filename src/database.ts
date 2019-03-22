import { randomBytes } from 'crypto';
import { existsSync, moveSync, pathExistsSync, readdirSync, statSync, mkdirSync } from 'fs-extra';
import * as objectPath from 'object-path';
import * as path from 'path';
import { noNoteDirs, metaFileName } from './constants';
import { tools, vfs, vpath } from './helper';

const noteNameRegex = /^[0-9]\.[a-z]+$/;

export interface Categories {
    [name: string]: string[];
}

export interface Domain {
    '.categories': Categories;
    [domain: string]: Domain | Categories;
}

export namespace DBCxt {
    export let dbDirPath: string;
    export let domainCache: Domain;
}

interface Tags {
    tags: Tag[];
}

interface Tag {
    tag: string;
    category: string;
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

    const trashDir = path.join(dbDirPath, 'trash');
    if (!existsSync(trashDir)) mkdirSync(trashDir);

    await initializeDBVariables(dbDirPath);
}

export async function refreshDomainCache(): Promise<Domain> {
    const cacheTags: Domain = { '.categories': {} };
    for (const id of readdirSync(DBCxt.dbDirPath).filter(f => !noNoteDirs.filter(nn => nn === f).length)) {
        const noteMeta = await readNoteMeta(id);
        for (const tag of noteMeta.tags) {
            const tagPath = vpath.splitPath(tag.tag);
            const categoryPath = tagPath.concat(['.categories', tag.category]);
            objectPath.push(cacheTags, categoryPath, id);
        }
    }
    return cacheTags;
}

export async function readNoteMeta(id: string): Promise<Tags> {
    const noteMetaFile = path.join(DBCxt.dbDirPath, id, metaFileName);
    return vfs.readYamlSync(noteMetaFile) as Tags;
}

export async function selectNotesUnderDomain(dpath: string[]): Promise<string[]> {
    const domain = await selectDomain(dpath);
    const notesCategories = domain['.categories'] ? Object.values<string[]>(domain['.categories']) : [];
    return ([] as string[]).concat(...notesCategories) || [];
}

export async function selectAllNotesUnderDomain(dpath: string[]): Promise<string[]> {
    const domain = await selectDomain(dpath);
    const childDomainNames: string[] = Object.keys(domain).filter(name => name !== '.categories');
    const notes: string[] = await selectNotesUnderDomain(dpath);
    if (childDomainNames.length === 0) {
        return notes;
    }
    const total: string[] = [];
    for (const name of childDomainNames) {
        const childDomainNotes: string[] = await selectAllNotesUnderDomain(dpath.concat(name));
        total.push(...childDomainNotes);
    }
    return total.concat(notes);
}

export function selectDocReadmeFile(nId: string): string {
    const indexFile = readdirSync(path.join(DBCxt.dbDirPath, nId, 'doc')).filter(f =>
        /^README\.*/.test(f)
    )[0];
    return path.join(DBCxt.dbDirPath, nId, 'doc', indexFile);
}

export function selectDocExist(nId: string): boolean {
    const docDir = path.join(DBCxt.dbDirPath, nId, 'doc');
    return (
        existsSync(path.join(docDir, 'README.md')) ||
        existsSync(path.join(docDir, 'README.html')) ||
        existsSync(path.join(docDir, 'README.htm'))
    );
}

export function selectFilesExist(nId: string): boolean {
    const filesDirPath = path.join(DBCxt.dbDirPath, nId, 'files');
    return pathExistsSync(filesDirPath);
}

export async function selectDomain(dpath: string[]): Promise<Domain> {
    return objectPath.get(DBCxt.domainCache, dpath);
}

export async function selectNoteContents(id: string): Promise<string[]> {
    const notePath = getNotePath(id);
    return readdirSync(notePath)
        .filter(f => noteNameRegex.test(f))
        .map(n => path.join(notePath, n))
        .filter(f => statSync(f).isFile)
        .map(f => vfs.readFileSync(f));
}

function genNewSeq(): string {
    const id = randomBytes(3).toString('hex');
    return existsSync(getNotePath(id)) ? genNewSeq() : id;
}

export async function createNode(dpath: string[], category: string = 'default'): Promise<string> {
    const newId = genNewSeq();
    const newNoteMetaFile = path.join(DBCxt.dbDirPath, newId, metaFileName);
    const newNoteOneFIle = path.join(DBCxt.dbDirPath, newId, '1.txt');
    vfs.writeYamlSync(newNoteMetaFile, { tags: [{ tag: dpath.join('/'), category }] });
    vfs.writeFileSync(newNoteOneFIle, '');
    const notes = objectPath.get<string[]>(DBCxt.domainCache, dpath.concat(['.categories', category]), []);
    notes.push(newId);
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
    objectPath.set(DBCxt.domainCache, oPath, { '.categories': {} }, true);
}

export async function resetNoteTags(dpath: string[], newName: string): Promise<void> {
    const opath = dpath.slice();
    opath[opath.length - 1] = newName;
    const notes = await selectAllNotesUnderDomain(dpath);
    for (const id of notes) {
        await resetNoteTag(id, dpath, opath);
    }
}

export async function selectCategory(dpath: string[], nId: string): Promise<string> {
    const domain = await selectDomain(dpath);
    const categories = domain['.categories'];
    for (const [k, v] of Object.entries(categories)) {
        if (v.includes(nId)) {
            return k;
        }
    }
    return '';
}

export const getNotePath = (id: string) => path.join(DBCxt.dbDirPath, id);

export const getTrashNotePath = (id: string) => path.join(DBCxt.dbDirPath, 'trash', id);

export const getNoteMetaFile = (id: string) => path.join(getNotePath(id), metaFileName);

export async function resetNoteTag(id: string, oldPreTag: string[], newPreTag: string[]): Promise<void> {
    const noteMetaFile = getNoteMetaFile(id);
    const noteMeta = vfs.readYamlSync(noteMetaFile);
    const replaceLength = oldPreTag.length;
    for (let i = 0; i < noteMeta.tags.length; i++) {
        const noteTag: string[] = noteMeta['tags'][i]['tag'].split('/').filter((s: string) => !!s);
        const preTag = noteTag.slice(0, oldPreTag.length);
        if (tools.arraysEqual(preTag, oldPreTag)) {
            noteTag.splice(0, replaceLength, ...newPreTag);
            noteMeta['tags'][i]['tag'] = noteTag.join('/');
        }
    }
    vfs.writeYamlSync(noteMetaFile, noteMeta);
}

export async function deleteNote(nId: string): Promise<void> {
    const notePath = getNotePath(nId);
    const trashNotePath = getTrashNotePath(nId);
    moveSync(notePath, trashNotePath);
    DBCxt.domainCache = await refreshDomainCache();
}

export async function createCategory(dpath: string[], name: string): Promise<void> {
    const cPath = dpath.concat('.categories').concat(name);
    objectPath.set(DBCxt.domainCache, cPath, [], true);
}

async function createExampleData(dbDirPath: string): Promise<void> {
    const notePath: string = path.join(dbDirPath, '1');
    vfs.mkdirsSync(notePath);
    vfs.writeFileSync(path.join(notePath, '1.txt'), 'windows');
    vfs.writeFileSync(path.join(notePath, '2.txt'), 'chose install powershell');
    vfs.writeFileSync(
        path.join(notePath, metaFileName),
        'tags:\n    - tag: /powershell/install\n      category: install'
    );
    vfs.mkdirsSync(path.join(notePath, 'doc'));
    vfs.writeFileSync(path.join(notePath, 'doc', 'README.md'), 'example.');
    vfs.mkdirsSync(path.join(notePath, 'files'));
    vfs.writeFileSync(path.join(notePath, 'files', 'example_01.txt'), 'example 01.');
    vfs.writeFileSync(path.join(notePath, 'files', 'example_02.txt'), 'example 02.');
}
