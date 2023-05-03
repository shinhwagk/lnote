"use strict";
const intersection = (array1, array2) => array1.filter((e) => array2.indexOf(e) !== -1);
const issubset = (child, father) => child.filter((e) => father.indexOf(e) !== -1).length === child.length;
const NoteEditContextMenuActions = [
    [
        {
            title: 'edit',
            onClick: (data) => vscode.postMessage({ command: 'note-editor', params: { nb: data.note.nb, nId: data.note.nId, labels: {} } })
        }
    ],
    [
        {
            title: 'create document',
            onClick: (data) => vscode.postMessage({ command: 'note-doc-create', params: { nb: data.note.nb, nId: data.note.nId } })
        },
        {
            title: 'create files',
            onClick: (data) => vscode.postMessage({ command: 'note-files-create', params: { nb: data.note.nb, nId: data.note.nId } })
        }
    ],
];
const CategoryEditContextMenuActions = [
    [
        {
            title: 'add note',
            onClick: (data) => vscode.postMessage({ command: 'notebook-editor', data: { kind: 'end', params: { nId: "0", labels: data.labels } } })
        }
    ],
    [
        {
            title: 'edit labels',
            onClick: (data) => vscode.postMessage({ command: 'notebook-editor', data: { kind: 'nsgl', params: { labels: data.labels } } })
        }
    ]
];
class ContextMenuDom {
    constructor() {
        this.elem = document.getElementById('contextMenu');
    }
    hide() {
        this.elem.style.display = 'none';
    }
    show(e, frameElem, menus, data) {
        this.elem.replaceChildren();
        let gidx = 0;
        for (const l of menus) {
            if (gidx >= 1 && gidx < menus.length) {
                const d_li = document.createElement('li');
                d_li.className = 'contextMenuDivider';
                this.elem.appendChild(d_li);
            }
            for (const i of l) {
                const d_li = document.createElement('li');
                d_li.className = 'contextMenuItem';
                d_li.textContent = i.title;
                d_li.onclick = () => i.onClick(data);
                this.elem.appendChild(d_li);
            }
            gidx += 1;
        }
        ;
        this.elem.style.display = 'block';
        this.elem.style.position = 'absolute';
        this.elem.style.top =
            (frameElem.getBoundingClientRect().bottom + this.elem.clientHeight <= document.documentElement.clientHeight
                ? e.pageY
                : e.pageY - this.elem.clientHeight) + 'px';
        this.elem.style.left =
            (e.pageX + this.elem.clientWidth <= document.documentElement.clientWidth
                ? e.pageX
                : document.documentElement.clientWidth - this.elem.clientWidth) + 'px';
    }
}
class NoteEditContextMenu {
}
function elemSpaces(num = 1) {
    const s = document.createElement('span');
    for (let i = 0; i < num; i++) {
        s.innerHTML += '&nbsp;';
    }
    return s;
}
function readerNote(container, note) {
    container.replaceChildren();
    const d_note = container;
    d_note.className = 'grid-note';
    const d_note_id = document.createElement('div');
    d_note_id.className = 'grid-note-id';
    d_note_id.oncontextmenu = (e) => { e.preventDefault(); };
    const d_cion = note.doc ? 'fa-file-word' : 'fa-ellipsis-h';
    const f_cion = note.files ? 'fa-folder' : 'fa-ellipsis-h';
    const d_space = document.createElement('span');
    d_space.title = `id: ${note.nId}, create date: ${note.cts}, modify date: ${note.mts}`;
    d_space.appendChild(elemSpaces(2));
    d_note_id.appendChild(elemIcon(d_cion, () => vscode.postMessage({ command: 'note-doc-show', params: { nb: note.nb, nId: nid } })));
    d_note_id.appendChild(d_space);
    d_note_id.appendChild(elemIcon(f_cion, () => vscode.postMessage({ command: 'note-files-open', params: { nb: note.nb, nId: nid } })));
    const d_note_content = document.createElement('div');
    d_note_content.className = 'grid-note-contents';
    d_note_content.style.gridTemplateColumns = `repeat(${note.contents.length}, 1fr)`;
    note.contents.forEach(c => {
        const d = document.createElement('div');
        d.className = 'grid-note-content';
        d.textContent = c;
        d_note_content.appendChild(d);
    });
    const d_note_edit = document.createElement('div');
    d_note_edit.className = 'grid-note-edit';
    d_note_edit.oncontextmenu = (e) => { e.preventDefault(); };
    const nid = note.nId;
    d_note_edit.appendChild(elemIcon('fa-pen', (ev) => {
        nccm.show(ev, d_note_edit, NoteEditContextMenuActions, { note: note });
    }));
    d_note.appendChild(d_note_id);
    d_note.appendChild(d_note_content);
    d_note.appendChild(d_note_edit);
}
function elemIcon(name, onclick = null) {
    const i = document.createElement('i');
    i.className = `fas ${name} fa-sm`;
    i.onclick = onclick;
    return i;
}
function arrayLabels2CategoryName(labelsOfCategory) {
    const gl = {};
    let name = "";
    for (const l of labelsOfCategory) {
        const [gname, label] = l.split('->');
        if (gname in gl) {
            gl[gname].push(label);
        }
        else {
            gl[gname] = [label];
        }
    }
    for (const [g, ls] of Object.entries(gl)) {
        name += `${g} -> `;
        name += ls.sort().join(',');
        name += '; ';
    }
    return name;
}
function readerCategory(fDom, labelsOfNotes) {
    let nameOfCategory = arrayLabels2CategoryName(labelsOfNotes);
    const d_category = document.createElement('div');
    d_category.className = 'grid-category';
    const d_category_name = document.createElement('div');
    d_category_name.textContent = nameOfCategory;
    d_category_name.className = 'grid-category-name';
    d_category_name.appendChild(elemSpaces());
    d_category_name.appendChild(elemSpaces());
    d_category_name.appendChild(elemIcon('fa-pen', (ev) => {
        nccm.show(ev, d_category_name, CategoryEditContextMenuActions, {
            labels: labelsOfNotes.map(l => l.trim())
        });
    }));
    d_category_name.appendChild(elemSpaces());
    const d_category_body = document.createElement('div');
    d_category_body.id = `category-body-${nameOfCategory.replace(/\s/g, '')}`;
    d_category_body.className = 'grid-category-body';
    for (const n of gs.notes) {
        if (issubset(n.labels, labelsOfNotes)) {
            const notesDom = document.createElement('div');
            notesDom.id = `note-${n.nId}`;
            d_category_body.appendChild(notesDom);
            readerNote(notesDom, n);
        }
        d_category.append(d_category_name, d_category_body);
        fDom.append(d_category, document.createElement('p'));
    }
}
function readerNotesCategories() {
    let localDom = document.getElementById('domain-categories');
    localDom.replaceChildren();
    const labelsOfNotes = new Set();
    for (const note of gs.notes) {
        if (gs.checkedLabels.size === 0) {
            labelsOfNotes.add(note.labels.sort().join('|||'));
        }
        else {
            if (intersection(note.labels, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size) {
                labelsOfNotes.add(note.labels.sort().join('|||'));
            }
        }
    }
    for (const cname of labelsOfNotes.values()) {
        readerCategory(localDom, cname.split('|||'));
    }
}
function readerNotesLabels() {
    const localDom = document.getElementById('notes-labels');
    localDom.replaceChildren();
    const _ava = new Set();
    const _com = [];
    for (const n of gs.notes) {
        if (gs.checkedLabels.size >= 1) {
            if (intersection(n.labels, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size) {
                n.labels.forEach(l => _ava.add(l));
                _com.push(n.labels);
            }
        }
        else {
            gs.allLabels.forEach(l => _ava.add(l));
            _com.push(n.labels);
        }
    }
    const _com1 = _com.reduce((p, c) => p.filter(e => c.includes(e)));
    for (const [g, ls] of gs.allGroupLabels.entries()) {
        const group_dom = document.createElement('div');
        const group_name_dom = document.createElement('label');
        group_name_dom.textContent = g;
        group_dom.append(group_name_dom, elemSpaces());
        for (const nl of Array.from(ls).sort()) {
            const group_label_dom = document.createElement('label');
            group_label_dom.className =
                gs.checkedLabels.size >= 1 ?
                    _com1.includes(nl) ?
                        'checkedLabel'
                        : gs.checkedLabels.has(nl)
                            ? 'checkedLabel'
                            : _ava.has(nl)
                                ? 'unCheckedLabel'
                                : 'unAvailableLabel'
                    : _com1.includes(nl)
                        ? 'checkedLabel'
                        : 'unCheckedLabel';
            group_label_dom.textContent = nl.split('->')[1];
            group_label_dom.onclick = () => {
                if (group_label_dom.className === 'unCheckedLabel') {
                    gs.checkedLabels.add(nl);
                }
                else if (group_label_dom.className === 'checkedLabel') {
                    gs.checkedLabels.delete(nl);
                }
                else {
                    return;
                }
                readerNotesLabels();
                readerNotesCategories();
            };
            group_dom.append(group_label_dom, elemSpaces());
        }
        localDom.append(group_dom);
    }
}
const nccm = new ContextMenuDom();
document.addEventListener('click', () => {
    nccm.hide();
}, true);
document.addEventListener('contextmenu', () => {
    console.log('global contextmenu click');
    nccm.hide();
}, true);
class GlobalState {
    constructor() {
        this.notes = [];
        this.s_s = 0;
        this.checkedLabels = new Set();
        this.allLabels = new Set();
        this.allGroupLabels = new Map();
    }
}
const gs = new GlobalState();
function groupLabel2Labels(groupLabels) {
    const labels = [];
    for (const [g, ls] of Object.entries(groupLabels)) {
        for (const l of ls) {
            labels.push(`${g}->${l}`);
        }
    }
    return labels;
}
function sortGroupLables(obj1) {
    return Object.keys(obj1).sort().reduce((obj, key) => {
        obj[key] = obj1[key].sort();
        return obj;
    }, {});
}
function labels2GroupLabel(labels) {
    const gl = {};
    for (const label of labels) {
        const [g, l] = label.split('->');
        if (g in gl) {
            gl[g].push(l);
        }
        else {
            gl[g] = [l];
        }
    }
    return sortGroupLables(gl);
}
window.addEventListener('message', (event) => {
    var _a, _b;
    const message = event.data;
    console.log('vscode-notes webview open.', message);
    switch (message.command) {
        case 'post-notes':
            const e_s = (new Date()).getTime();
            gs.notes = message.data.notes;
            document.getElementById('search-time').textContent = `${e_s - gs.s_s} ms`;
            for (const n of gs.notes) {
                n.labels.forEach(n => gs.allLabels.add(n));
                for (const label of n.labels) {
                    const [g] = label.split('->');
                    if (gs.allGroupLabels.has(g)) {
                        (_a = gs.allGroupLabels.get(g)) === null || _a === void 0 ? void 0 : _a.add(label);
                    }
                    else {
                        gs.allGroupLabels.set(g, new Set([label]));
                    }
                }
            }
            const labelsDom = document.createElement('div');
            labelsDom.id = 'notes-labels';
            const categoriesDom = document.createElement('div');
            categoriesDom.id = 'domain-categories';
            const e_domain = document.createElement('div');
            e_domain.append(labelsDom, document.createElement('br'), categoriesDom);
            (_b = document.getElementById('content')) === null || _b === void 0 ? void 0 : _b.replaceChildren(e_domain);
            readerNotesLabels();
            readerNotesCategories();
            break;
        default:
            document.body.innerHTML = '<h1>loading...{message}</h1>';
    }
});
function myFunction() {
    var _a;
    gs.s_s = (new Date()).getTime();
    const x = (_a = document.getElementById("APjFqb")) === null || _a === void 0 ? void 0 : _a.value;
    if (x) {
        const keywords = x.trim().split(/\s+/);
        if (keywords.length >= 1) {
            vscode.postMessage({ command: 'search', data: { keywords: keywords } });
        }
    }
}
//# sourceMappingURL=search.js.map