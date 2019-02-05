import * as path from 'path';
import * as jsyml from 'js-yaml';
import { existsSync, readdirSync, statSync, mkdirSync } from 'fs-extra';
import * as objectPath from 'object-path';
import { vpath, vfs } from './helper';

export interface VSNDomain {
    domains: string[];
    notes: number[];
}

export interface VSNNote {
    id: number;
    meta: VSNNoteMeta;
    contents: string[];
}

interface VSNNoteMeta {
    category: string;
    docOrFiles: boolean;
}

let notesDirPath: string;
const noteNameRegex = /^[0-9]\.[a-z]+$/;
let cacheDomains: any;
let seqFilePath: string;

export async function initDB(dbDirPath: string): Promise<void> {
    notesDirPath = path.join(dbDirPath);
    seqFilePath = path.join(dbDirPath, 'seq');
    await createDBIfNotExist(dbDirPath);
    await cacheDB();
}

async function createDBIfNotExist(dbDirPath: string): Promise<void> {
    if (!existsSync(dbDirPath)) {
        vfs.mkdirsSync(dbDirPath, notesDirPath);
        await createExampleData(dbDirPath);
    }
}

export async function fusionNoteTags(notesDirPath: string) {
    const cacheDomains: any = {};
    for (const id of readdirSync(notesDirPath).filter(f => f !== 'seq')) {
        const noteMetaFile = path.join(notesDirPath, id, '.n.yml');
        const noteMeta = jsyml.safeLoad(vfs.readFileSync(noteMetaFile));
        const tags = noteMeta['tags'];
        for (const tag of tags) {
            const t: string = tag['tag'];
            const c: string = tag['category'] || 'default';
            const sp = vpath.splitPath(path.join(t, '.notes'));
            objectPath.ensureExists(cacheDomains, sp, []);
            const notes: number[] = objectPath.get(cacheDomains, sp);
            notes.push(Number(id));
            objectPath.set(cacheDomains, sp, notes);
        }
    }
    return cacheDomains;
}

async function cacheDB(): Promise<void> {
    cacheDomains = await fusionNoteTags(notesDirPath);
}

export function selectDocReadmeFilePath(nId: number): string {
    return path.join(notesDirPath, nId.toString(), 'doc', 'README.md');
}

export async function selectDomainNotesCount(dpath: string): Promise<number> {
    const domain = await selectDomain(dpath);
    if (domain.domains.length === 0) return domain.notes.length;
    let total = 0;
    for (const d of domain.domains) {
        const dp = path.join(dpath, d);
        total += (await selectDomainNotesCount(dp)) + domain.notes.length;
    }
    return total;
}

export function selectFilesExist(nId: number): boolean {
    const filesDirPath = path.join(notesDirPath, nId.toString(), 'files');
    const files = readdirSync(filesDirPath);
    return files.length >= 2 || statSync(path.join(filesDirPath, files[0])).size >= 1;
}

export async function selectDomain(dpath: string): Promise<VSNDomain> {
    const domain = objectPath.get(cacheDomains, vpath.splitPath(dpath));
    const domains: string[] = Object.keys(domain).filter(name => name !== '.notes');
    return { domains, notes: domain['.notes'] || [] };
}

export async function selectNotes(dpath: string): Promise<VSNNote[]> {
    const domain = await selectDomain(dpath);
    return Promise.all(domain.notes.map(id => selectNote(dpath, id)));
}

async function selectNote(dpath: string, id: number): Promise<VSNNote> {
    const notePath = path.join(notesDirPath, id.toString());
    const noteMetaPath = path.join(notePath, '.n.yml');
    const contents = readdirSync(notePath)
        .filter(f => noteNameRegex.test(f))
        .map(n => path.join(notePath, n))
        .filter(f => statSync(f).isFile)
        .map(f => vfs.readFileSync(f));

    const meta = jsyml.safeLoad(vfs.readFileSync(noteMetaPath));
    const category = meta['tags'].filter((tag: any) => tag['tag'] === dpath)[0]['category'];
    const existDoc =
        existsSync(selectDocReadmeFilePath(id)) && statSync(selectDocReadmeFilePath(id)).size >= 1;
    const existFiles = selectFilesExist(id);
    return {
        id,
        contents,
        meta: { category: category, docOrFiles: existDoc || existFiles }
    };
}

export async function createNote(dpath: string): Promise<number> {
    const noteid: number = await incSeq();
    const oPath = vpath.splitPath(path.join(dpath, '.notes'));
    const notes = objectPath.get<number[]>(cacheDomains, oPath, []);
    notes.push(noteid);
    objectPath.set(cacheDomains, oPath, notes);
    const notePath = path.join(notesDirPath, noteid.toString());

    mkdirSync(notePath);

    vfs.writeFileSync(path.join(notePath, '1.txt'), '');
    vfs.writeFileSync(path.join(notePath, '.n.yml'), 'category:');

    vfs.mkdirsSync(path.join(notePath, 'doc'), path.join(notePath, 'files'));
    vfs.writeFileSync(path.join(notePath, 'doc', 'README.md'), '');
    vfs.writeFileSync(path.join(notePath, 'files', 'main.txt'), '');

    await checkout();
    return noteid;
}

async function selectSeq(): Promise<number> {
    return Number(vfs.readFileSync(seqFilePath));
}

async function incSeq(): Promise<number> {
    const seq = (await selectSeq()) + 1;
    vfs.writeFileSync(seqFilePath, seq.toString());
    return seq;
}

export async function createNodeCol(nid: number): Promise<void> {
    const notePath = path.join(notesDirPath, nid.toString());
    const cnt = readdirSync(notePath).length - 2;
    vfs.writeFileSync(path.join(notePath, `${cnt}.txt`), '');
}

export async function createDomain(dpath: string, name: string): Promise<void> {
    const oPath = vpath.splitPath(path.join(dpath, name));
    if (objectPath.has(cacheDomains, oPath)) return;
    objectPath.set(cacheDomains, oPath, { '.notes': [] });
    await checkout();
}

async function checkout(): Promise<void> {}
export async function renameDomain(dpath: any, newName: string): Promise<void> {
    const opath = vpath.splitPath(dpath);
    const domain = _selectDomain(dpath);
    opath[opath.length - 1] = newName;
    objectPath.set(cacheDomains, opath, domain);
    await deleteDomain(dpath);
    await checkout();
}

async function deleteDomain(dpath: string): Promise<void> {
    const oPath = vpath.splitPath(dpath);
    objectPath.del(cacheDomains, oPath);
    await checkout();
}

export async function deleteNote(dpath: string, noteId: number): Promise<void> {
    const domain = objectPath.get(cacheDomains, vpath.splitPath(dpath));
    const newNotes = domain['.notes'].filter((i: number) => i !== noteId);
    objectPath.set(cacheDomains, vpath.splitPath(path.join(dpath, '.notes')), newNotes);
    await checkout();
}

export function _selectDomain(dpath: string): any {
    return objectPath.get(cacheDomains, vpath.splitPath(dpath));
}

async function createExampleData(dbDirPath: string): Promise<void> {
    vfs.writeFileSync(path.join(dbDirPath, 'seq'), '5');
    let notePath_1 = path.join(notesDirPath, '1');
    let notePath_2 = path.join(notesDirPath, '2');
    vfs.mkdirsSync(notePath_1, notePath_2);

    vfs.writeFileSync(path.join(notePath_1, '1.txt'), 'windows');
    vfs.writeFileSync(path.join(notePath_1, '2.txt'), 'chose install powershell');
    vfs.writeFileSync(path.join(notePath_1, '.n.yml'), 'category: install');
    vfs.mkdirsSync(path.join(notePath_1, 'doc'));
    vfs.writeFileSync(path.join(notePath_1, 'doc', 'README.md'), 'example.');
    vfs.mkdirsSync(path.join(notePath_1, 'files'));
    vfs.writeFileSync(path.join(notePath_1, 'files', 'example_01.txt'), 'example 01.');
    vfs.writeFileSync(path.join(notePath_1, 'files', 'example_02.txt'), 'example 02.');

    vfs.writeFileSync(path.join(notePath_2, '1.txt'), 'linux');
    vfs.writeFileSync(path.join(notePath_2, '2.txt'), 'yum install powershell');
    vfs.writeFileSync(path.join(notePath_2, '.n.yml'), 'category: install');
    vfs.mkdirsSync(path.join(notePath_2, 'doc'));
    vfs.writeFileSync(path.join(notePath_2, 'doc', 'README.md'), 'example.');
    vfs.mkdirsSync(path.join(notePath_2, 'files'));
    vfs.writeFileSync(path.join(notePath_2, 'files', 'example.txt'), 'example.');
}
