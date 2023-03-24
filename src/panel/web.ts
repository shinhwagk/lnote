import { INBNote } from "../database/note";
import { groupLabel2ArrayLabels } from "../database/notes";
import { tools } from "../helper";
import { ArrayLabels } from "../types";

enum WebLabelState {
    checked,
    uncheck,
    unusable
}

export interface IWebData {
    arrayLabels: string[]

}

export class WebStatus {
    selectedArraylabels: string[] = [];
    notes: INBNote[] = [];
    notesLabels = new Set<string>();
    checkedLabels: ArrayLabels = [];
    unCheckedLabels: ArrayLabels = [];
    availableNotes: any[] = [];

    categories = new Map<string, any[]>();
    commonLabels: string[] = [];

    process(domainNode: string[], notes: INBNote[]) {
        this.notes = notes;

        // [...(new Set<string>(.flatMap(ls => ls))).values()];
        this.createCategories();
        this.commonLabels = this.availableNotes.map(n => n.labels).map(l => groupLabel2ArrayLabels(l)).reduce((p, c) => p.filter(e => c.includes(e)));
    }

    setLabel(op: 'checked' | 'uncheck', label: string) {
        if (op === 'checked') {
            this.checkedLabels.push(label);
            this.unCheckedLabels = this.unCheckedLabels.filter(l => l !== label);
        } else if (op === 'uncheck') {
            this.unCheckedLabels.push(label);
            this.checkedLabels = this.checkedLabels.filter(l => l !== label);
        } else { }
    }

    initNotesLabels() {
        this.notesLabels = new Set(this.notes.map(n => n.labels).map(l => groupLabel2ArrayLabels(l)).flatMap(l => l));
    }

    createCategories() {
        const categories = new Map<string, any[]>();
        for (const note of this.notes) {
            const nal = groupLabel2ArrayLabels(note.labels);
            const cname = nal.sort().join('|||');
            if (tools.intersections(nal, this.checkedLabels).length === this.checkedLabels.length) {
                if (categories.has(cname)) {
                    categories.get(cname)?.push(note);
                } else {
                    categories.set(cname, [note]);
                }
                this.availableNotes.push(note);
            }
        }
        this.categories = categories;
    }
}