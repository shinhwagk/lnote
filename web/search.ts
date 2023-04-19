/* eslint-disable @typescript-eslint/naming-convention */
const intersection = (array1: string[], array2: string[]) => array1.filter((e) => array2.indexOf(e) !== -1);

const issubset = (child: string[], father: string[]) => child.filter((e) => father.indexOf(e) !== -1).length === child.length;


interface vscode {
    postMessage(message: any): void;
}

declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;

interface DataDomain {
    domainNode: string[];
    checkedLabels: string[];
    // categories: DataCategory[];
    notes: DataNote[];
    // note: PostNote
    labels: string[];
    domainLabels: string[];
    domainNotes: DataNote[];
    nId: string;
    domainArrayLabel: string[];
    domainGroupLabel: { [g: string]: string[] };
}

// interface DataCategory {
//     name: string;
//     labels: string[]
//     notes: DataNote[];
// }

// interface DataNote1 {
//     nb: string;
//     nId: string;
//     contents: string[];
//     doc: boolean;
//     files: boolean;
//     cts: number;
//     mts: number;
//     labels: string[];
//     category: string;
// }

interface DataProtocol {
    command: string;
    data: DataDomain;
}

interface DataNote {
    nb: string;
    nId: string;
    contents: string[];
    doc: boolean;
    files: boolean;
    cts: number;
    mts: number;
    labels: string[];
    category: string;
}

interface ContextMenuAction {
    title: string;
    onClick: (data: any) => void;
}

const NoteEditContextMenuActions: ContextMenuAction[][] = [
    [
        {
            title: 'edit',
            onClick: (data: { note: DataNote }) => vscode.postMessage({ command: 'note-editor', params: { nb: data.note.nb, nId: data.note.nId, labels: {} } })
        }
    ],
    [
        {
            title: 'create document',
            onClick: (data: { note: DataNote }) => vscode.postMessage({ command: 'note-doc-create', params: { nb: data.note.nb, nId: data.note.nId } })
        },
        {
            title: 'create files',
            onClick: (data: { note: DataNote }) => vscode.postMessage({ command: 'note-files-create', params: { nb: data.note.nb, nId: data.note.nId } })
        }
    ],
    // [
    //   {
    //     title: 'remove',
    //     onClick: (data) => vscode.postMessage({ command: 'note-remove', data: { nId: data.note.nId } })
    //   }
    // ]
    // ,
    // [
    //   {
    //     title: 'open note folder',
    //     onClick: (data) => vscode.postMessage({ command: 'edit-note-openfolder', data: { nId: data.note.nId } })
    //   }
    // ]
];

const CategoryEditContextMenuActions: ContextMenuAction[][] = [
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
    ],
    [
        {
            title: 'remove',
            onClick: (data) => vscode.postMessage({ command: 'notebook-domain-category-remove', data: { labels: data.labels } })
        }
    ]
];

// const NoteColContextMenuActions: ContextMenuAction[][] = [
//   [
//     {
//       title: 'edit short document',
//       onClick: (data: any) => vscode.postMessage({ command: 'notebook-note-contents-edit', data: { nId: data.nId } })
//     }
//   ], [
//     {
//       title: 'delete short document',
//       onClick: (data: any) => vscode.postMessage({ command: 'notebook-note-contents-remove', data: { nId: data.nId } })
//     }
//   ]
//   // [
//   //   {
//   //     title: 'send to active terminal',
//   //     onClick: (data: any) => vscode.postMessage({ command: 'col-to-terminal', data: { id: data.id, cidx: data.i } })
//   //   },
//   //   {
//   //     title: 'send to active terminal with args',
//   //     onClick: (_data: any) => {
//   //       // new abc(context, e).show();
//   //     } /* vscode.postMessage({ command: 'col-to-terminal-args', data: { id: nid, args: colIdx } } */
//   //   }
//   // ]
// ];

// const DomainContextMenuActions: ContextMenuAction[][] = [
//   [
//     {
//       title: 'relabels',
//       onClick: (data: any) => vscode.postMessage({ command: 'notebook-editor', params: { labels: data.labels } })
//     }
//   ]
// ];

class ContextMenuDom {
    private readonly elem: HTMLElement = document.getElementById('contextMenu')!;
    public hide() {
        this.elem.style.display = 'none';
    }

    public show(e: MouseEvent, frameElem: HTMLElement, menus: ContextMenuAction[][], data: any) {
        this.elem.replaceChildren();
        let gidx = 0; // group index
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
        };
        this.elem!.style.display = 'block';
        this.elem!.style.position = 'absolute';

        this.elem!.style.top =
            (frameElem.getBoundingClientRect().bottom + this.elem.clientHeight <= document.documentElement.clientHeight
                ? e.pageY
                : e.pageY - this.elem.clientHeight) + 'px';
        this.elem!.style.left =
            (e.pageX + this.elem.clientWidth <= document.documentElement.clientWidth
                ? e.pageX
                : document.documentElement.clientWidth - this.elem.clientWidth) + 'px';
    }
}

class NoteEditContextMenu { }


function elemSpaces(num: number = 1) {
    const s = document.createElement('span');
    for (let i = 0; i < num; i++) {
        s.innerHTML += '&nbsp;';
    }
    return s;
}

function readerNote(container: HTMLElement, note: DataNote): void {
    container.replaceChildren();

    const d_note = container;
    d_note.className = 'grid-note';
    // d_note.id = `note_${note.nId}`;

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

    // if (this.note.doc) { necma[0].shift() }
    // if (this.note.files) { necma[0].pop() }
    d_note_edit.appendChild(
        elemIcon('fa-pen', (ev: MouseEvent) => {
            nccm.show(ev, d_note_edit, NoteEditContextMenuActions, { note: note });
        })
    );

    d_note.appendChild(d_note_id);
    d_note.appendChild(d_note_content);
    d_note.appendChild(d_note_edit);
    // return d_note;
}

function elemIcon(name: string, onclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null = null) {
    const i = document.createElement('i');
    i.className = `fas ${name} fa-sm`;
    i.onclick = onclick;
    return i;
}

// function filterSearch(categories: DataCategory[], key: string) {
//     const newCategory: DataCategory[] = [];
//     for (const category of categories) {
//         const newNotes: DataNote[] = [];
//         for (const note of category.notes) {
//             for (const content of note.contents) {
//                 if (new RegExp(key).test(content)) {
//                     newNotes.push(note);
//                     break;
//                 }
//             }
//         }
//         if (newNotes.length >= 1) {
//             newCategory.push({ name: category.name, notes: newNotes, labels: category.labels });
//         }
//     }
//     return newCategory;
// }

function arrayLabels2CategoryName(labelsOfCategory: string[]): string {
    const gl: { [g: string]: string[] } = {};
    let name = "";
    for (const l of labelsOfCategory) {
        const [gname, label] = l.split('->');
        if (gname in gl) {
            gl[gname].push(label);
        } else {
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

function readerCategory(fDom: Element, labelsOfNotes: string[]) {
    // labelsOfCategory = labelsOfCategory === '' ? '---' : labelsOfCategory;
    let nameOfCategory = arrayLabels2CategoryName(labelsOfNotes); //labelsOfCategory.join(', ');

    // nameOfCategory = nameOfCategory === '' ? '---' : nameOfCategory;
    // const localDom = document.getElementById(`domain-category-${categoryName.replace(' ', '')}`)!;

    const d_category = document.createElement('div');
    // d_category.id = nameOfCategory.replace(' ', '');
    d_category.className = 'grid-category';

    const d_category_name = document.createElement('div');
    d_category_name.textContent = nameOfCategory;
    d_category_name.className = 'grid-category-name';
    // d_category_name.ondblclick = () => vscode.postMessage({ command: 'edit-category', data: { category: this.name } })
    // d_category_name.oncontextmenu = (e) => {
    //     e.preventDefault();
    //     // todo for rename
    // };

    d_category_name.appendChild(elemSpaces());
    // d_category_name.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'add', data: this.name })));
    d_category_name.appendChild(elemSpaces());
    d_category_name.appendChild(
        elemIcon('fa-pen', (ev: MouseEvent) => {
            nccm.show(ev, d_category_name, CategoryEditContextMenuActions, {
                labels: labelsOfNotes.map(l => l.trim()) //.concat(`common->${gs.domainNode}`)
            });
        })
    );
    d_category_name.appendChild(elemSpaces());
    // const d_category_labels = document.createElement('span');
    // d_category_labels.style.fontSize = '10px';
    // d_category_labels.textContent = this.labels.join(',');
    // d_category_name.append(d_category_labels);

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
        // d_category.append(d_category_name, d_category_body);
        // return d_category;
    }
}

function readerNotesCategories() {
    let localDom = document.getElementById('domain-categories')!;
    localDom.replaceChildren();

    // const categoriesDom = document.createElement('div');
    // categoriesDom.id = 'domain-categories';
    // document.getElementById('content')?.replaceChildren(categoriesDom);

    // this.nIds = domainNotes.map(n => n.nId);
    const labelsOfNotes = new Set<string>();
    for (const note of gs.notes) {
        // const cname = note.labels.filter(f => !gs.domainLabels.concat(gs.domainNode[0]).includes(f)).sort().join(',');
        if (gs.checkedLabels.size === 0) {
            labelsOfNotes.add(note.labels.sort().join('|||'));
        } else {
            if (intersection(note.labels, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size) {
                labelsOfNotes.add(note.labels.sort().join('|||'));
            }
        }

        // const n = { nId: note.nId, contents: note.contents, cDate: note.cts.toString(), mDate: note.mts.toString(), doc: note.doc, files: note.files };
        // if (cname in categories) {
        //   categories[cname].push(note);
        // } else {
        //   categories[cname] = [note];
        //   // const cDom = document.createElement('div');
        //   // localDom.append(cDom)
        //   // cDom.id = `domain-category-${cname.replace(' ', '')}`;
        // }
    }
    // const _categories = this.search && filter ? filterSearch(this.categories, filter) : this.categories;
    for (const cname of labelsOfNotes.values()) {
        readerCategory(localDom, cname.split('|||'));
        // document.getElementById(`domain-category-${cname.replace(' ', '')}`)?.append(document.createElement('p'));
    }
}

interface NoteLabel {
    checked: boolean;
    label: string;
    group: string;
    // group label: `${group}->${label}`
    gl: string;
    available: boolean;

    //   dom(){

    // }
}





function readerNotesLabels() {
    const localDom = document.getElementById('notes-labels')!;
    localDom.replaceChildren();

    const _ava = new Set<string>();
    const _com: string[][] = [];

    for (const n of gs.notes) {
        if (gs.checkedLabels.size >= 1) {
            if (intersection(n.labels, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size) {
                n.labels.forEach(l => _ava.add(l));
                _com.push(n.labels);
            }
        } else {
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
            // importance!!!
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
                } else if (group_label_dom.className === 'checkedLabel') {
                    gs.checkedLabels.delete(nl);
                } else {
                    return;
                }
                readerNotesLabels();
                readerNotesCategories();
            };
            group_dom.append(group_label_dom, elemSpaces());
        }
        localDom.append(group_dom);
    }

    // // patch
    // for (
    //   const label of gs.domainLabels
    //     .filter(l => l !== gs.domainNode[0])
    // ) {
    //   const d = document.createElement('label');
    //   d.className = 'checkedFixLabel';
    //   d.textContent = label;
    //   // labelDoms.push(d);
    //   localDom.append(d, elemSpaces());
    // }

    // for (const { label, checked } of _labels) {
    //   const d = document.createElement('label');
    //   d.className = checked ? 'checkedLabel' : 'unCheckedLabel';
    //   d.textContent = label;
    //   d.onclick = () => {
    //     d.className = d.className === 'unCheckedLabel' ? 'checkedLabel' : 'unCheckedLabel';
    //     if (d.className === 'unCheckedLabel') {
    //       gs.checkedLabels = gs.checkedLabels.filter(l => l !== label);
    //     } else {
    //       gs.checkedLabels.push(label);
    //     }
    //     readerCategories();
    //   };
    //   // labelDoms.push(d);
    //   localDom.append(d, elemSpaces());
    // }
}

// function readerDomainName() {
//     const e_domain = document.createElement('div');
//     const e_title = document.createElement('h2');
//     const e_domain_name = document.createElement('span');
//     const e_search = document.createElement('input');
//     e_search.type = 'text';
//     e_search.style.display = 'none';
//     e_search.focus();
//     e_search.onkeydown = () => {
//         // this.readerCategories(i.value);
//     };

//     e_domain_name.textContent = gs.domainNode.join(' / ');
//     // const e_search = elemNotesSearch();
//     e_title.appendChild(e_domain_name);
//     e_title.appendChild(elemSpaces());
//     e_title.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'notebook-editor', data: { kind: 'end', params: { nId: "0", labels: gs.domainArrayLabels } } })));
//     e_title.appendChild(elemSpaces());
//     e_title.appendChild(elemIcon('fa-pen', () => vscode.postMessage({ command: 'notebook-editor', data: { kind: 'edgl', params: {} } })));
//     e_title.appendChild(elemSpaces());
//     e_title.appendChild(
//         elemIcon('fa-search', () => {
//             if (!gs.search) {
//                 gs.search = true;
//                 e_search.style.display = 'block';
//             } else {
//                 gs.search = false;
//                 e_search.style.display = 'none';
//             }
//         })
//     );
//     e_title.appendChild(e_search);

//     // labels
//     const labelsDom = document.createElement('div');
//     labelsDom.id = 'notes-labels';

//     // categories
//     const categoriesDom = document.createElement('div');
//     categoriesDom.id = 'domain-categories';

//     e_domain.append(e_title, labelsDom, document.createElement('br'), categoriesDom);
//     document.getElementById('content')?.replaceChildren(e_domain);
// }

const nccm = new ContextMenuDom();
document.addEventListener(
    'click',
    () => {
        nccm.hide();
    },
    true
);
document.addEventListener(
    'contextmenu',
    () => {
        console.log('global contextmenu click');
        nccm.hide();
    },
    true
);

class GlobalState {
    notes: DataNote[] = [];
    s_s = 0;
    checkedLabels = new Set<string>();
    // init once
    allLabels = new Set<string>();
    // init once
    allGroupLabels = new Map<string, Set<string>>();
}

const gs = new GlobalState();

function groupLabel2Labels(groupLabels: { [gl: string]: string[] }) {
    const labels = [];
    for (const [g, ls] of Object.entries(groupLabels)) {
        for (const l of ls) {
            labels.push(`${g}->${l}`);
        }
    }
    return labels;
}

type GroupLables = { [gl: string]: string[] };

function sortGroupLables(obj1: GroupLables): GroupLables {
    return Object.keys(obj1).sort().reduce(
        (obj, key) => {
            obj[key] = obj1[key].sort();
            return obj;
        },
        {} as GroupLables
    );
}

function labels2GroupLabel(labels: string[]): GroupLables {
    const gl: { [g: string]: string[] } = {};
    for (const label of labels) {
        const [g, l] = label.split('->');
        if (g in gl) {
            gl[g].push(l);
        } else {
            gl[g] = [l];
        }
    }
    return sortGroupLables(gl);
}


window.addEventListener('message', (event) => {
    const message: DataProtocol = event.data;
    console.log('vscode-notes webview open.', message);
    switch (message.command) {
        case 'post-notes':
            const e_s = (new Date()).getTime();
            gs.notes = message.data.notes;
            document.getElementById('search-time')!.textContent = `${e_s - gs.s_s} ms`;

            for (const n of gs.notes) {

                n.labels.forEach(n => gs.allLabels.add(n));
                for (const label of n.labels) {
                    const [g] = label.split('->');
                    if (gs.allGroupLabels.has(g)) {
                        gs.allGroupLabels.get(g)?.add(label);
                    } else {
                        const s = new Set<string>();
                        s.add(label);
                        gs.allGroupLabels.set(g, s);
                    }
                }
            }

            // lables
            const labelsDom = document.createElement('div');
            labelsDom.id = 'notes-labels';

            // categories
            const categoriesDom = document.createElement('div');
            categoriesDom.id = 'domain-categories';

            const e_domain = document.createElement('div');
            e_domain.append(labelsDom, document.createElement('br'), categoriesDom);

            document.getElementById('content')?.replaceChildren(e_domain);

            readerNotesLabels();
            readerNotesCategories();

            break;
        // case 'delete-note':
        //   document.getElementById(`note - ${ message.data.nId }`)?.remove();
        //   break;
        // case 'post-note':
        //   const el = document.getElementById(`note - ${ message.data.note.nId }`);
        //   if (el !== null) {
        //     readerNote(el, message.data.note);
        //   } else {
        //     const cname = message.data.note.labels.filter(l => !gs.domainLabels.includes(l)).sort().join(', ').replace(/\s/g, '');
        //     const noteDom = document.createElement('div');
        //     noteDom.id = `note - ${ message.data.note.nId }`;
        //     document.getElementById(`category - body - ${ cname }`)?.append(noteDom);
        //     readerNote(noteDom, message.data.note);
        //   }
        //   break;
        default:
            document.body.innerHTML = '<h1>loading...{message}</h1>';
    }
});

function myFunction() {
    gs.s_s = (new Date()).getTime();
    const x = (<HTMLTextAreaElement>document.getElementById("APjFqb"))?.value;
    // document.createElement('textarea')
    if (x) {
        const keywords = x.trim().split(' ');
        if (keywords.length >= 2) {
            vscode.postMessage({ command: 'search', data: { keywords: keywords } });
        }
    }
    // document.getElementById("content").innerHTML = "You selected: " + x;
}
//
// vscode.postMessage({ command: 'get-data' });
// console.log('Ready to accept data.');