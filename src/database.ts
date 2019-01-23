import * as path from 'path';
import * as jsyml from 'js-yaml';
import { existsSync, readdirSync, statSync, mkdirSync } from 'fs-extra';
import * as objectPath from 'object-path';
import { ext } from './extensionVariables';
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
    doc: boolean;
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
    cacheDomains = await cacheDB();
}

async function createDBIfNotExist(): Promise<void> {
    if (!existsSync(ext.dbDirPath)) {
        vfs.mkdirsSync(ext.dbDirPath, notesDirPath);
        await createExampleData();
    }
}

async function cacheDB(): Promise<void> {
    return vfs.readJSONSync(domainsFilePath);
}

export function selectDocReadmeFilePath(nId: number): string {
    return path.join(notesDirPath, nId.toString(), 'doc', 'README.md');
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
    const existDoc = statSync(selectDocReadmeFilePath(id)).size >= 1;
    return { id, contents, meta: { category: meta.category || 'default', doc: existDoc } };
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
    let notePath = path.join(notesDirPath, '1');
    vfs.mkdirsSync(notePath);
    vfs.writeFileSync(path.join(notePath, '1.txt'), 'windows');
    vfs.writeFileSync(path.join(notePath, '2.txt'), 'chose install powershell');
    vfs.writeFileSync(path.join(notePath, '.n.yml'), 'category: install');
    vfs.mkdirsSync(path.join(notePath, 'doc'));
    vfs.writeFileSync(path.join(notePath, 'doc', 'README.md'), 'example.');

    notePath = path.join(notesDirPath, '2');
    vfs.mkdirsSync(notePath);
    vfs.writeFileSync(path.join(notePath, '1.txt'), 'linux');
    vfs.writeFileSync(path.join(notePath, '2.txt'), 'yum install powershell');
    vfs.writeFileSync(path.join(notePath, '.n.yml'), 'category: install');
}
