/* eslint-disable @typescript-eslint/naming-convention */

interface vscode {
    postMessage(message: any): void;
}

declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;


type GroupLables = { [gl: string]: string[] };

declare const webKind: 'search' | 'domain';

const intersection = (array1: string[], array2: string[]) => array1.filter((e) => array2.indexOf(e) !== -1);

const issubset = (child: string[], father: string[]) => child.filter((e) => father.indexOf(e) !== -1).length === child.length;

interface DataDomain {
    domainNode: string[];
    dn: string[];
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

interface DataProtocol {
    command: string;
    data: DataDomain;
}

interface DataNote {
    nb: string;
    id: string;
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




const NoteEditContextMenuActions: ContextMenuAction[][] = [
    [
        {
            title: 'edit',
            onClick: (data: { note: DataNote }) => vscode.postMessage({ command: 'note-edit', params: { nb: data.note.nb, nId: data.note.id } })
        }
    ],
    [
        {
            title: 'create document',
            onClick: (data: { note: DataNote }) => vscode.postMessage({ command: 'note-doc-create', params: { nb: data.note.nb, nId: data.note.id } })
        },
        {
            title: 'create files',
            onClick: (data: { note: DataNote }) => vscode.postMessage({ command: 'note-files-create', params: { nb: data.note.nb, nId: data.note.id } })
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
            onClick: (data) => vscode.postMessage({ command: 'note-add', params: { nb: data.nb, labels: data.labels } })
        }
    ],
    // [
    //     {
    //         title: 'edit labels',
    //         onClick: (data) => vscode.postMessage({ command: 'notebook-editor', data: { kind: 'nsgl', params: { labels: data.labels } } })
    //     }
    // ]
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
    d_space.title = `id: ${note.id}, create date: ${note.cts}, modify date: ${note.mts}`;
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
    const nid = note.id;

    // if (this.note.doc) { necma[0].shift() }
    // if (this.note.files) { necma[0].pop() }
    d_note_edit.appendChild(
        elemIcon('fa-pen', (ev: MouseEvent) => {
            const necms = NoteEditContextMenuActions;
            const cmas: ContextMenuAction[][] = [necms[0], []];
            note.doc || cmas[1].push(necms[1][0]);
            note.files || cmas[1].push(necms[1][1]);
            if (cmas[1].length === 0) {
                vscode.postMessage({ command: 'note-edit', params: { nb: note.nb, nId: note.id } });
                return;
            }
            gs.nccm.show(ev, d_note_edit, cmas, { note: note });
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
            // labelsOfNotes.filter(l => l.startsWith('##nb'))[0].split('->')[1];
            gs.nccm.show(ev, d_category_name, CategoryEditContextMenuActions, {
                // nb:
                nb: labelsOfNotes.filter(l => l.startsWith('##nb'))[0].split('->')[1],
                labels: labelsOfNotes.concat(gs.dn.map(n => `domain->${n}`)).map(l => l.trim()) //.concat(`common->${gs.domainNode}`)
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
        if (intersection(n.labels, labelsOfNotes).length === labelsOfNotes.length) {
            const notesDom = document.createElement('div');
            notesDom.id = `note-${n.id}`;
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
    let localDom = document.getElementById('notes-categories')!;
    localDom.replaceChildren();

    // const categoriesDom = document.createElement('div');
    // categoriesDom.id = 'notes-categories';
    // document.getElementById('content')?.replaceChildren(categoriesDom);

    // this.nIds = domainNotes.map(n => n.nId);
    const labelsOfNotes = new Set<string>();

    if (gs.checkedLabels.size === 0) {
        gs.notes.map(n => n.labels.sort().join('|||')).forEach(l => labelsOfNotes.add(l));
    } else {
        gs.notes.filter(n => intersection(n.labels, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size)
            .map(n => n.labels.sort().join('|||'))
            .forEach(l => labelsOfNotes.add(l));
    }
    // for (const note of gs.notes) {
    //     const nlabels = note.labels.sort();
    //     // const cname = note.labels.filter(f => !gs.domainLabels.concat(gs.domainNode[0]).includes(f)).sort().join(',');
    //     if (gs.checkedLabels.size === 0) {
    //         labelsOfNotes.add(nlabels.join('|||'));
    //     } else {
    //         if (intersection(nlabels, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size) {
    //             labelsOfNotes.add(nlabels.join('|||'));
    //         }
    //     }
    // }

    for (const cname of labelsOfNotes.values()) {
        readerCategory(localDom, cname.split('|||'));
    }
}

function readerNotesLabels() {
    console.log("readerNotesLabels", gs.checkedLabels);
    const localDom = document.getElementById('notes-labels')!;
    localDom.replaceChildren();

    // labels for all the checked notes
    const _ava = new Set<string>();
    // common labels for every the checked notes
    const _com: string[][] = [];

    for (const n of gs.notes) {
        if (gs.checkedLabels.size >= 1) {
            if (intersection(n.labels, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size) {
                n.labels.forEach(l => _ava.add(l));
                _com.push(n.labels);
            }
        } else {
            gs.allArrayLabels.forEach(l => _ava.add(l));
            _com.push(n.labels);
        }
    }
    const _com1 = _com.length >= 1 ? _com.reduce((p, c) => p.filter(e => c.includes(e))) : [];

    for (const [g, ls] of gs.allGroupLabels.entries()) {
        const group_dom = document.createElement('div');
        const group_name_dom = document.createElement('label');
        group_name_dom.textContent = g;
        group_dom.append(group_name_dom, elemSpaces());

        for (const nl of Array.from(ls).sort()) {
            const group_label_dom = document.createElement('label');
            // importance!!!
            if (gs.checkedLabels.size >= 1) {
                if (gs.checkedLabels.has(nl) && _com1.includes(nl)) {
                    group_label_dom.className = 'checkedLabel';
                } else if (_com1.includes(nl)) {
                    group_label_dom.className = 'forceCheckedLabel';
                } else if (_ava.has(nl)) {
                    group_label_dom.className = 'unCheckedLabel';
                } else {
                    group_label_dom.className = 'unAvailableLabel';
                }
            } else {
                if (_com1.includes(nl)) {
                    group_label_dom.className = 'forceCheckedLabel';
                } else {
                    group_label_dom.className = 'unCheckedLabel';
                }
            }
            // group_label_dom.className =
            //     gs.checkedLabels.size >= 1 ?
            //         gs.checkedLabels.has(nl) && _com1.includes(nl) ?
            //             _com1.includes(nl) ?
            //                 'forceCheckedLabel'
            //                 : gs.checkedLabels.has(nl)
            //                     ? 'checkedLabel'
            //                     : _ava.has(nl)
            //                         ? 'unCheckedLabel'
            //                         : 'unAvailableLabel'
            //             : "checkedLabel"
            //         : _com1.includes(nl)
            //             ? 'checkedLabel'
            //             : 'unCheckedLabel';
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

function readerDomainName() {
    const e_domain = document.getElementById('domain');
    e_domain?.replaceChildren();

    const e_title = document.createElement('h2');
    const e_domain_name = document.createElement('span');
    const e_search = document.createElement('input');
    e_search.type = 'text';
    e_search.style.display = 'none';
    e_search.focus();
    e_search.onkeydown = () => {
        // this.readerCategories(i.value);
    };

    e_domain_name.textContent = `Domain: ${gs.dn.join(' / ')}`;
    // const e_search = elemNotesSearch();
    e_title.appendChild(e_domain_name);
    e_title.appendChild(elemSpaces());
    // e_title.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'notebook-editor', data: { kind: 'end', params: { nId: "0", labels: gs.domainArrayLabels } } })));
    e_title.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'domain-note-add', params: { dn: gs.dn } })));
    e_title.appendChild(elemSpaces());
    e_title.appendChild(elemIcon('fa-pen', () => vscode.postMessage({ command: 'domain-labels-edit', params: {} })));
    e_title.appendChild(elemSpaces());
    // e_title.appendChild(
    //     elemIcon('fa-search', () => {
    //         if (!gs.search) {
    //             gs.search = true;
    //             e_search.style.display = 'block';
    //         } else {
    //             gs.search = false;
    //             e_search.style.display = 'none';
    //         }
    //     })
    // );
    // e_title.appendChild(e_search);

    // labels
    // const labelsDom = document.createElement('div');
    // labelsDom.id = 'notes-labels';

    // // categories
    // const categoriesDom = document.createElement('div');
    // categoriesDom.id = 'notes-categories';

    // e_domain.append(e_title, labelsDom, document.createElement('br'), categoriesDom);
    // document.getElementById('content')?.replaceChildren(e_domain);
    // console.log(e_title);
    e_domain?.append(e_title);
}

class GlobalState {
    notes: DataNote[] = [];
    s_s = 0;
    checkedLabels = new Set<string>();
    // init once
    allArrayLabels = new Set<string>();
    // init once
    allGroupLabels = new Map<string, Set<string>>();

    domainNode: string[] = [];
    dn: string[] = [];
    nccm: ContextMenuDom = new ContextMenuDom();
}

function groupLabel2Labels(groupLabels: { [gl: string]: string[] }) {
    const labels = [];
    for (const [g, ls] of Object.entries(groupLabels)) {
        for (const l of ls) {
            labels.push(`${g}->${l}`);
        }
    }
    return labels;
}

function sortGroupLables(obj1: GroupLables): GroupLables {
    return Object.keys(obj1).sort().reduce(
        (obj, key) => {
            obj[key] = obj1[key].sort();
            return obj;
        },
        {} as GroupLables
    );
}

// function labels2GroupLabel(labels: string[]): GroupLables {
//     const gl: { [g: string]: string[] } = {};
//     for (const label of labels) {
//         const [g, l] = label.split('->');
//         if (g in gl) {
//             gl[g].push(l);
//         } else {
//             gl[g] = [l];
//         }
//     }
//     return sortGroupLables(gl);
// }

function searchAction() {
    gs.s_s = (new Date()).getTime();
    const x = (<HTMLTextAreaElement>document.getElementById("APjFqb"))?.value;
    // document.createElement('textarea')
    if (x) {
        const keywords = x.trim().split(/\s+/);
        if (keywords.length >= 1) {
            vscode.postMessage({ command: 'search', params: { keywords: keywords } });
        }
    }
    // document.getElementById("content").innerHTML = "You selected: " + x;
}

// <div id="root">
// <div id="content"></div>
// <ul id="contextMenu" class="contextMenu"></ul>
// </div>

function initFrameDoms() {
    // search 
    const searchDom = document.createElement('div');
    searchDom.className = "search";
    const searchTextAreaDom = document.createElement('textarea');
    searchTextAreaDom.id = "APjFqb";
    searchTextAreaDom.className = "searchTextArea";
    searchTextAreaDom.maxLength = 2048;
    searchTextAreaDom.rows = 1;
    // searchTextAreaDom.value = "@test default";
    const searchButtonDom = document.createElement('button');
    searchButtonDom.className = "searchButton";
    searchButtonDom.onclick = searchAction;
    searchButtonDom.textContent = "search";
    const searchTimeDom = document.createElement('span');
    searchTimeDom.id = "search-time";

    searchDom.append(searchTextAreaDom, searchButtonDom, searchTimeDom);

    // const contentDom = document.createElement('div');
    // contentDom.id = "content";
    const menuDom = document.createElement('ul');
    menuDom.id = "contextMenu";
    menuDom.className = "contextMenu";

    // domain 
    const domainDom = document.createElement('div');
    domainDom.id = "domain";

    // lables
    const labelsDom = document.createElement('div');
    labelsDom.id = 'notes-labels';

    // categories
    const categoriesDom = document.createElement('div');
    categoriesDom.id = 'notes-categories';

    // const e_domain = document.createElement('div');
    // e_domain.append(labelsDom, document.createElement('br'), categoriesDom);

    // document.getElementById('content')?.replaceChildren(e_domain);
    const doms = webKind === 'domain' ? [domainDom, labelsDom, categoriesDom, menuDom] : [searchDom, labelsDom, categoriesDom, menuDom];
    document.getElementById('root')?.append(...doms);

    // gs.nccm = new ContextMenuDom();
}

function processNotes() {
    gs.allArrayLabels.clear();
    gs.allGroupLabels.clear();

    for (const n of gs.notes) {
        n.labels.forEach(n => gs.allArrayLabels.add(n));
        for (const label of n.labels) {
            const [g] = label.split('->');
            if (gs.allGroupLabels.has(g)) {
                gs.allGroupLabels.get(g)?.add(label);
            } else {
                gs.allGroupLabels.set(g, new Set([label]));
            }
        }
    }
}

document.addEventListener('click', () => gs.nccm.hide(), true);

document.addEventListener('contextmenu', () => gs.nccm.hide(), true);

window.addEventListener('message', (event) => {
    const message: DataProtocol = event.data;
    console.log('vscode-notes webview open.', webKind, message);
    switch (message.command) {
        case 'post-search':
            const e_s = (new Date()).getTime();
            gs.notes = message.data.notes;
            document.getElementById('search-time')!.textContent = `${e_s - gs.s_s} ms`;

            processNotes();

            readerNotesLabels();
            readerNotesCategories();
            break;
        case 'post-domain':
            gs.dn = message.data.dn;
            gs.notes = message.data.notes;

            processNotes();

            // gs.allGroupLabels.delete('##nb');
            readerDomainName();
            readerNotesLabels();
            readerNotesCategories();
            break;
        default:
            document.body.innerHTML = '<h1>loading...{message}</h1>';
    }
});


initFrameDoms();
// new GlobalState after initFrameDoms
const gs = new GlobalState();

if (webKind === 'domain') {
    vscode.postMessage({ command: 'domain' });
}