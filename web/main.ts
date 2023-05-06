/* eslint-disable @typescript-eslint/naming-convention */

interface vscode {
    postMessage(message: any): void;
}

declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;

type GroupLables = { [gl: string]: string[] };

const jointMark = '->';

const intersection = (array1: string[], array2: string[]) => array1.filter((e) => array2.indexOf(e) !== -1);

// const issubset = (child: string[], father: string[]) => child.filter((e) => father.indexOf(e) !== -1).length === child.length;

interface IData {
    dn: string[];
    notes: DataNote[];
    wk: 'domain' | 'search'; // webkind
    dals: string[]
    dgls: GroupLables
}

interface DataProtocol {
    command: string;
    data: IData;
}

interface DataNote {
    nb: string;
    id: string;
    contents: string[];
    doc: boolean;
    files: boolean;
    cts: number;
    mts: number;
    als: string[];
    category: string;
}

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

    const d_cion = note.doc ? 'fa-file-word' : 'fa-ellipsis-h';
    const f_cion = note.files ? 'fa-folder' : 'fa-ellipsis-h';

    const d_space = document.createElement('span');
    d_space.title = `id: ${note.id}, create date: ${note.cts}, modify date: ${note.mts}`;
    d_space.appendChild(elemSpaces(2));

    d_note_id.appendChild(elemIcon(d_cion, 'show doc', () => vscode.postMessage({ command: 'note-doc-show', params: { nb: note.nb, nId: note.id } })));
    d_note_id.appendChild(d_space);
    d_note_id.appendChild(elemIcon(f_cion, 'show files', () => vscode.postMessage({ command: 'note-files-open', params: { nb: note.nb, nId: note.id } })));

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

    d_note_edit.appendChild(elemIcon('fa-pen', "edit note", () => vscode.postMessage({ command: 'note-edit', params: { nb: note.nb, nId: note.id } })));
    d_note_edit.appendChild(elemSpaces());

    const d_note_edit_extend = elemIcon('fa-right-long', 'extend', () => {
        document.getElementById(`note-edit-extend-${note.id}`)?.remove();
        if (!note.doc) {
            d_note_edit.appendChild(elemSpaces());
            d_note_edit.appendChild(elemIcon('fa-file-circle-plus', 'create doc', () => vscode.postMessage({ command: 'note-doc-create', params: { nb: note.nb, nId: note.id } })));
        }
        if (!note.files) {
            d_note_edit.appendChild(elemSpaces());
            d_note_edit.appendChild(elemIcon('fa-folder-plus', 'create files', () => vscode.postMessage({ command: 'note-files-create', params: { nb: note.nb, nId: note.id } })));
        }
        d_note_edit.appendChild(elemSpaces());
        d_note_edit.appendChild(elemIcon('fa-xmark', 'create files', () => vscode.postMessage({ command: 'note-remove', params: { nb: note.nb, id: note.id } })));

    });
    d_note_edit_extend.id = `note-edit-extend-${note.id}`;
    d_note_edit.appendChild(d_note_edit_extend);

    d_note.appendChild(d_note_id);
    d_note.appendChild(d_note_content);
    d_note.appendChild(d_note_edit);
}

function elemIcon(name: string, title: string, onclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null = null) {
    const i = document.createElement('i');
    i.className = `fas ${name} fa-sm`;
    i.onclick = onclick;
    i.title = title;
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
        const [gname, label] = l.split(jointMark);
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

function readerCategory(fdom: Element, als: string[]) {
    // labelsOfCategory = labelsOfCategory === '' ? '---' : labelsOfCategory;
    let nameOfCategory = arrayLabels2CategoryName(als); //labelsOfCategory.join(', ');

    const _notes = gs.notes.filter(n => intersection(n.als, als).length === als.length);


    // nameOfCategory = nameOfCategory === '' ? '---' : nameOfCategory;
    // const localDom = document.getElementById(`domain-category-${categoryName.replace(' ', '')}`)!;

    const d_category = document.createElement('div');
    // d_category.id = nameOfCategory.replace(' ', '');
    d_category.className = 'grid-category';

    const d_category_name = document.createElement('div');
    d_category_name.textContent = nameOfCategory;
    d_category_name.className = 'grid-category-name';
    // d_category_name.ondblclick = () => vscode.postMessage({ command: 'edit-category', data: { category: this.name } })
    // const nb = als.filter(l => l.startsWith('##nb'))[0].split('->')[1];

    // const _nb = gWebKind === 'domain' ? gs.dn[0] : als.filter(l => l.startsWith('##nb->'))[0]

    d_category_name.appendChild(elemSpaces());
    d_category_name.appendChild(elemIcon('fa-plus', 'create note',
        () => vscode.postMessage({ command: 'common-notes-note-add', params: { als: als } }))
    );

    d_category_name.appendChild(elemSpaces());
    d_category_name.appendChild(elemIcon('fa-pen', 'edit labels',
        () => vscode.postMessage({ command: 'common-notes-labels-edit', params: { als: als } }))
    );
    // labelsOfNotes.filter(l => l.startsWith('##nb'))[0].split('->')[1];

    //     // nb:
    //     nb: als.filter(l => l.startsWith('##nb'))[0].split('->')[1],
    //     labels: als.concat(gs.dn.map(n => `domain->${n}`)).map(l => l.trim()) //.concat(`common->${gs.domainNode}`)
    // });
    // d_category_name.appendChild(elemSpaces());
    // const d_category_labels = document.createElement('span');
    // d_category_labels.style.fontSize = '10px';
    // d_category_labels.textContent = this.labels.join(',');
    // d_category_name.append(d_category_labels);

    const d_category_body = document.createElement('div');
    // d_category_body.id = `category-body-${nameOfCategory.replace(/\s/g, '')}`;
    d_category_body.className = 'grid-category-body';

    for (const n of _notes) {
        const notesDom = document.createElement('div');
        notesDom.id = `note-${n.id}`;
        d_category_body.appendChild(notesDom);
        readerNote(notesDom, n);

        d_category.append(d_category_name, d_category_body);
        fdom.append(d_category, document.createElement('p'));
        // d_category.append(d_category_name, d_category_body);
        // return d_category;
    }
}

function readerCategories() {
    let localDom = document.getElementById('notes-categories')!;
    localDom.replaceChildren();

    // const categoriesDom = document.createElement('div');
    // categoriesDom.id = 'notes-categories';
    // document.getElementById('content')?.replaceChildren(categoriesDom);

    // this.nIds = domainNotes.map(n => n.nId);
    const labelsOfNotes = new Set<string>();

    if (gs.checkedLabels.size === 0) {
        gs.notes.map(n => n.als.sort().join('|||')).forEach(l => labelsOfNotes.add(l));
    } else {
        gs.notes.filter(n => intersection(n.als, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size)
            .map(n => n.als.sort().join('|||'))
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

function readerLabels() {
    const localDom = document.getElementById('notes-labels')!;
    localDom.className = 'group-labels';
    localDom.replaceChildren();

    // labels for all the checked notes
    const _ava = new Set<string>();
    // common labels for every the checked notes
    const _com: string[][] = [];

    for (const n of gs.notes) {
        if (gs.checkedLabels.size >= 1) {
            if (intersection(n.als, Array.from(gs.checkedLabels)).length === gs.checkedLabels.size) {
                n.als.forEach(l => _ava.add(l));
                _com.push(n.als);
            }
        } else {
            gs.allArrayLabels.forEach(l => _ava.add(l));
            _com.push(n.als);
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
                if (gs.checkedLabels.has(nl)) {
                    group_label_dom.className = 'pinCheckedLabel';
                } else {
                    if (_ava.has(nl)) {
                        if (_com1.includes(nl)) {
                            group_label_dom.className = 'checkedLabel';
                        } else {
                            group_label_dom.className = 'unCheckedLabel';
                        }
                    } else {
                        group_label_dom.className = 'unAvailableLabel';
                    }
                }
            } else {
                if (_ava.has(nl)) {
                    if (_com1.includes(nl)) {
                        group_label_dom.className = 'forceCheckedLabel';
                    } else {
                        group_label_dom.className = 'unCheckedLabel';
                    }
                } else {
                    group_label_dom.className = 'unAvailableLabel';
                }
            }
            // group_label_dom.className =
            //     gs.checkedLabels.size >= 1 ?
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
            group_label_dom.textContent = nl.split(jointMark)[1];
            group_label_dom.onclick = () => {
                if (group_label_dom.className === 'unCheckedLabel') {
                    gs.checkedLabels.add(nl);
                } else if (['checkedLabel', 'pinCheckedLabel'.includes(group_label_dom.className)]) {
                    gs.checkedLabels.delete(nl);
                } else {
                    return;
                }
                readerLabels();
                readerCategories();
            };
            group_dom.append(group_label_dom, elemSpaces());
        }
        localDom.append(group_dom);
    }
    localDom.append(document.createElement('p'));
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

    e_domain_name.textContent = `${gs.dn.join(' / ')}`;
    // const e_search = elemNotesSearch();
    e_title.appendChild(e_domain_name);
    e_title.appendChild(elemSpaces());
    // 
    // e_title.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'notebook-editor', data: { kind: 'end', params: { nId: "0", labels: gs.domainArrayLabels } } })));
    // const als = gs.dn.map(d => `domain->${d}`).concat(`##nb->${gs.dn[0]}`);
    e_title.appendChild(elemIcon('fa-plus', 'create note', () => vscode.postMessage({ command: 'common-notes-note-add', params: { als: gs.dals } })));
    e_title.appendChild(elemSpaces());
    e_title.appendChild(elemIcon('fa-pen', 'edit labes', () => vscode.postMessage({ command: 'domain-labels-edit', params: { dn: gs.dn } })));
    e_title.appendChild(elemSpaces());
    e_title.appendChild(elemIcon('fa-rotate-right', 'refresh', () => vscode.postMessage({ command: 'domain-refresh', params: { dn: gs.dn } })));
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

    // domain only
    dals: string[] = []; // domain arraylabels
    // dgls: GroupLables = {};
    dn: string[] = []; // domainnode
    nb: string = "";   // notebook
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

function searchAction() {
    gs.s_s = (new Date()).getTime();
    const x = (<HTMLTextAreaElement>document.getElementById("APjFqb"))?.value;
    // document.createElement('textarea')
    if (x) {
        const keywords = x.trim().split(/\s+/);
        if (keywords.length >= 1) {
            vscode.postMessage({ command: 'get-search', params: { keywords: keywords } });
        }
    }
    // document.getElementById("content").innerHTML = "You selected: " + x;
}

function initFrameDoms(webKind: 'domain' | 'search') {
    const rootDom = document.getElementById('root');
    rootDom?.replaceChildren();
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
    const doms = webKind === 'domain' ? [domainDom, labelsDom, categoriesDom] : [searchDom, labelsDom, categoriesDom];
    rootDom?.append(...doms);
}

function processNotes() {
    gs.allArrayLabels.clear();
    gs.allGroupLabels.clear();

    for (const n of gs.notes) {
        n.als.forEach(n => gs.allArrayLabels.add(n));
        for (const label of n.als) {
            const [g] = label.split(jointMark);
            if (gs.allGroupLabels.has(g)) {
                gs.allGroupLabels.get(g)?.add(label);
            } else {
                gs.allGroupLabels.set(g, new Set([label]));
            }
        }
    }
}

function sendWebReady() {
    vscode.postMessage({ command: 'web-ready' });
}

function sendWebInitReady() {
    vscode.postMessage({ command: 'web-init-ready' });
}

window.addEventListener('message', (event) => {
    const message: DataProtocol = event.data;
    // console.log(message);
    switch (message.command) {
        // case 'init-search':
        case 'init-frame-doms':
            initFrameDoms(message.data.wk);
            gs = new GlobalState();
            sendWebInitReady();
            break;
        case 'post-search':
            const e_s = (new Date()).getTime();
            gs.notes = message.data.notes;
            document.getElementById('search-time')!.textContent = `${e_s - gs.s_s} ms`;

            processNotes();

            readerLabels();
            readerCategories();
            break;
        case 'post-domain':
            gs.dn = message.data.dn;
            gs.notes = message.data.notes;
            gs.dals = message.data.dals;

            processNotes();

            readerDomainName();
            readerLabels();
            readerCategories();
            break;
        default:
            document.body.innerHTML = '<h1>loading...{message}</h1>';
    }
});

console.log('lnotes webview open.');
// initFrameDoms();
// new GlobalState after initFrameDoms
let gs = new GlobalState();

sendWebReady();
