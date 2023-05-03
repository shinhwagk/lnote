"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebStatus = void 0;
const notes_1 = require("../database/notes");
const helper_1 = require("../helper");
var WebLabelState;
(function (WebLabelState) {
    WebLabelState[WebLabelState["checked"] = 0] = "checked";
    WebLabelState[WebLabelState["uncheck"] = 1] = "uncheck";
    WebLabelState[WebLabelState["unusable"] = 2] = "unusable";
})(WebLabelState || (WebLabelState = {}));
class WebStatus {
    selectedArraylabels = [];
    notes = [];
    notesLabels = new Set();
    checkedLabels = [];
    unCheckedLabels = [];
    availableNotes = [];
    categories = new Map();
    commonLabels = [];
    process(domainNode, notes) {
        this.notes = notes;
        // [...(new Set<string>(.flatMap(ls => ls))).values()];
        this.createCategories();
        this.commonLabels = this.availableNotes.map(n => n.labels).map(l => (0, notes_1.groupLabel2ArrayLabels)(l)).reduce((p, c) => p.filter(e => c.includes(e)));
    }
    setLabel(op, label) {
        if (op === 'checked') {
            this.checkedLabels.push(label);
            this.unCheckedLabels = this.unCheckedLabels.filter(l => l !== label);
        }
        else if (op === 'uncheck') {
            this.unCheckedLabels.push(label);
            this.checkedLabels = this.checkedLabels.filter(l => l !== label);
        }
        else { }
    }
    initNotesLabels() {
        this.notesLabels = new Set(this.notes.map(n => n.labels).map(l => (0, notes_1.groupLabel2ArrayLabels)(l)).flatMap(l => l));
    }
    createCategories() {
        const categories = new Map();
        for (const note of this.notes) {
            const nal = (0, notes_1.groupLabel2ArrayLabels)(note.labels);
            const cname = nal.sort().join('|||');
            if (helper_1.tools.intersections(nal, this.checkedLabels).length === this.checkedLabels.length) {
                if (categories.has(cname)) {
                    categories.get(cname)?.push(note);
                }
                else {
                    categories.set(cname, [note]);
                }
                this.availableNotes.push(note);
            }
        }
        this.categories = categories;
    }
}
exports.WebStatus = WebStatus;
//# sourceMappingURL=web.js.map