import { ToWebView as twv } from './notesMessage';
import { tools } from '../helper';
import { DatabaseFileSystem } from '../database';
import { vpath } from '../helper';

export class PanelViewCache {

    private viewData: twv.WVDomain | undefined;
    private dbFileSystem: DatabaseFileSystem;

    constructor(dbFileSystem: DatabaseFileSystem) {
        this.dbFileSystem = dbFileSystem;
    }

    public parseAndCache(dpath: string[]) {
        this.viewData = this.genViewData(dpath);
        return this;
    }

    public addCategory(name: string) {
        this.viewData!.categories.push({ name: name, notes: [] });
        return this;
    }

    public getViewData() {
        return this.viewData;
    }

    private genViewData(dpath: string[]): twv.WVDomain {
        const domain = this.dbFileSystem.selectDomain(dpath);
        const categories = [];
        for (const nId of domain['.notes']) {
            const notes = [];
            const cname = this.dbFileSystem.selectNoteMeta(nId).tags
                .filter(tag => tools.arraysEqual(vpath.splitPath(tag.tag), dpath))[0].category;

            const contents: string[] = this.dbFileSystem.selectNoteContents(nId);
            const isDoc = this.dbFileSystem.selectDocExist(nId);
            const isFiles = this.dbFileSystem.selectFilesExist(nId);
            notes.push({ nId, contents, doc: isDoc, files: isFiles });

            categories.push({ name: cname, notes });
        }
        return { name: dpath[dpath.length - 1], categories: categories };
    }
}