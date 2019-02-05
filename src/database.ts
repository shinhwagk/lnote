import * as path from 'path';
import * as jsyml from 'js-yaml';
import { existsSync, readdirSync, statSync, mkdirSync } from 'fs-extra';
import * as objectPath from 'object-path';
import { ext } from './extensionVariables';
import { vpath, vfs } from './helper';
import { isNumber } from 'util';

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
let domainsFilePath: string;
let seqFilePath: string;

export async function initDB(): Promise<void> {
    notesDirPath = path.join(ext.dbDirPath, 'notes');
    domainsFilePath = path.join(ext.dbDirPath, 'domains.json');
    seqFilePath = path.join(ext.dbDirPath, 'seq');
    await createDBIfNotExist();
    await cacheDB();
}

async function createDBIfNotExist(): Promise<void> {
    if (!existsSync(ext.dbDirPath)) {
        vfs.mkdirsSync(ext.dbDirPath, notesDirPath);
        await createExampleData();
    }
}


async function fusionNoteTags() {
    for (const id of readdirSync(notesDirPath).filter(isNumber)) {
        const noteMetaFile = path.join(notesDirPath, id, ".n.yml");
        const noteMeta = jsyml.safeLoad(noteMetaFile);
        const tags = noteMeta["tags"];
        for (const tag of tags) {
            const t: string = tag["tag"];
            const c: string = tag["category"] || "default";
            const category: {
                ".category": { [category: string]: number[] }
            } = objectPath.ensureExists(cacheDomains, t.split("/").filter(s => !!s), { ".category": {} });
            if (!category[".category"][c]) category[".category"][c] = [];
            category[".category"][c].push(Number(id));
            objectPath.set(cacheDomains, t.split("/").filter(s => !!s), category);
        }
    }
}

async function cacheDB(): Promise<void> {
    cacheDomains = {};
    fusionNoteTags();
    // cacheDomains = vfs.readJSONSync(domainsFilePath);
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
    return { domains, notes: domain['.notes'] };
}

export async function selectNotes(dpath: string): Promise<VSNNote[]> {
    const domain = await selectDomain(dpath);
    return Promise.all(domain.notes.map(id => selectNote(id)));
}

async function selectNote(id: number): Promise<VSNNote> {
    const notePath = path.join(notesDirPath, id.toString());
    const noteMetaPath = path.join(notePath, '.n.yml');
    const contents = readdirSync(notePath)
        .filter(f => noteNameRegex.test(f))
        .map(n => path.join(notePath, n))
        .filter(f => statSync(f).isFile)
        .map(f => vfs.readFileSync(f));

    const meta = jsyml.safeLoad(vfs.readFileSync(noteMetaPath));
    const existDoc =
        existsSync(selectDocReadmeFilePath(id)) && statSync(selectDocReadmeFilePath(id)).size >= 1;
    const existFiles = selectFilesExist(id);
    return {
        id,
        contents,
        meta: { category: meta.category || 'default', docOrFiles: existDoc || existFiles }
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

async function checkout(): Promise<void> {
    vfs.writeJsonSync(domainsFilePath, cacheDomains);
}
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

async function createExampleData(): Promise<void> {
    const data: { [domain: string]: any } = {
        powershell: {
            install: { '.notes': [1, 2] },
            '.notes': []
        }
    };
    vfs.writeFileSync(path.join(ext.dbDirPath, 'seq'), '5');
    vfs.writeJsonSync(domainsFilePath, data);

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
