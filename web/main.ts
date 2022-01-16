interface vscode {
    postMessage(message: any): void;
}

declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;

interface DataDomain {
    dpath: string[];
    categories: DataCategory[];
}

interface DataCategory {
    name: string;
    notes: DataNote[];
}

interface DataNote {
    nId: string;
    contents: string[];
    doc: boolean;
    files: boolean;
}

interface DataProtocol {
    command: 'data';
    data: DataDomain;
}

const NoteColContextMenuActions = [
    [
        {
            title: 'add short document',
            onClick: (nid: string) => vscode.postMessage({ command: 'edit-col-add', data: { id: nid } }),
        },
        {
            title: 'delete short document',
            onClick: (nid: string, colIdx: string) =>
                vscode.postMessage({ command: 'edit-col-remove', data: { id: nid, cn: Number(colIdx) + 1 } }),
        },
    ],
    [
        {
            title: 'send to active terminal',
            onClick: (nid: string, cIdx: string) =>
                vscode.postMessage({ command: 'col-to-terminal', data: { id: nid, cidx: cIdx } }),
        },
        {
            title: 'send to active terminal with args',
            onClick: (_nid: string, _colIdx: string, context: string, e: MouseEvent) => {
                new abc(context, e).show();
            } /*vscode.postMessage({ command: 'col-to-terminal-args', data: { id: nid, args: colIdx } }*/,
        },
    ],
];

class abc {
    constructor(private readonly _context: string, e: MouseEvent) {
        const f = document.createElement('form');
        f.className = 'contextMenu';
        const args1 = document.createElement('input');
        args1.type = 'text' + this._context;
        args1.name = 'args1';

        const but = document.createElement('input');
        but.type = 'button';
        but.name = 'button';
        f.appendChild(args1);
        f.appendChild(but);
        f!.style.display = 'block';
        f!.style.position = 'absolute';
        f!.style.top = e.pageY + 'px';
        f!.style.left = e.pageX + 'px';
        document.getElementById('root')?.appendChild(f);
    }

    show() { }
}

class NoteColContextMenu {
    elem: HTMLElement | null = null;
    constructor() { }

    public close() {
        if (this.elem !== null) {
            this.elem.remove();
            this.elem = null;
        }
    }

    public show(id: string, idx: string, content: string, e: MouseEvent) {
        this.elem = document.createElement('ul');
        document.getElementById('root')?.appendChild(this.elem);
        this.elem.className = 'contextMenu';
        let gidx = 0; // group index
        for (const l of NoteColContextMenuActions) {
            if (gidx >= 1 && gidx < NoteColContextMenuActions.length) {
                const d_li = document.createElement('li');
                d_li.className = 'contextMenuDivider';
                this.elem.appendChild(d_li);
            }
            for (const i of l) {
                const d_li = document.createElement('li');
                d_li.className = 'contextMenuItem';
                d_li.textContent = i.title;
                d_li.onclick = () => i.onClick(id, idx, content, e);
                this.elem.appendChild(d_li);
            }

            gidx += 1;
        }
        this.elem.id = 'NoteColContextMenu';
        this.elem!.style.display = 'block';
        this.elem!.style.position = 'absolute';
        this.elem!.style.top = e.pageY + 'px';
        this.elem!.style.left = e.pageX + 'px';
    }
}

class NoteEditContextMenu { }

const nccm = new NoteColContextMenu();

class VNNote {
    constructor(private readonly note: DataNote) { }
    dom(): HTMLHeadingElement {
        const d_note = document.createElement('div');
        d_note.className = 'grid-note';

        const d_note_id = document.createElement('div');
        d_note_id.className = 'grid-note-id';
        d_note_id.oncontextmenu = (e) => {
            e.preventDefault();
        };

        const d_cion = this.note.doc ? 'fa-file-word' : 'fa-ellipsis-h';
        const f_cion = this.note.files ? 'fa-folder' : 'fa-ellipsis-h';

        const d_space = document.createElement('span');
        d_space.appendChild(elemSpaces(2));

        d_note_id.appendChild(elemIcon(d_cion, () => vscode.postMessage({ command: 'doc', data: nid })));
        d_note_id.appendChild(d_space);
        d_note_id.appendChild(elemIcon(f_cion, () => vscode.postMessage({ command: 'files', data: nid })));

        const d_note_content = document.createElement('div');
        d_note_content.className = 'grid-note-content';
        d_note_content.style.gridTemplateColumns = `repeat(${this.note.contents.length}, 1fr)`;

        for (let i = 0; i <= this.note.contents.length; i++) {
            const d = document.createElement('div');
            d.ondblclick = () => {
                vscode.postMessage({ command: 'edit-contentFile', data: { id: this.note.nId, n: i + 1 } });
            };
            d.textContent = this.note.contents[i];
            d.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                nccm.close();
                nccm.show(this.note.nId, i.toString(), this.note.contents[i], e);
            });
            // d.oncontextmenu =
            d_note_content.appendChild(d);
        }

        const d_note_edit = document.createElement('div');
        d_note_edit.className = 'grid-note-edit';
        const nid = this.note.nId;
        d_note_edit.onclick = () => {
            vscode.postMessage({ command: 'edit', data: { id: nid, category: '' } });
        };

        d_note_edit.appendChild(elemIcon('fa-pen'));

        d_note.appendChild(d_note_id);
        d_note.appendChild(d_note_content);
        d_note.appendChild(d_note_edit);
        return d_note;
    }
}

function elemSpaces(num: number = 1) {
    const s = document.createElement('span');
    for (let i = 0; i < num; i++) {
        s.innerHTML += '&nbsp;';
    }
    return s;
}

class VNCategory {
    constructor(private readonly name: string, private readonly notes: DataNote[]) { }
    doms(): HTMLHeadingElement {
        const d_category = document.createElement('div');
        d_category.className = 'grid-category';

        const d_category_name = document.createElement('div');
        d_category_name.textContent = this.name;
        d_category_name.className = 'grid-category-name';
        d_category_name.oncontextmenu = (e) => {
            e.preventDefault();
            // todo for rename
        };

        d_category_name.appendChild(elemSpaces());
        d_category_name.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'add', data: this.name })));

        const d_category_body = document.createElement('div');
        d_category_body.className = 'grid-category-body';

        for (const n of this.notes) {
            const d_n = new VNNote(n).dom();
            d_category_body.appendChild(d_n);
        }

        d_category.append(d_category_name, d_category_body);
        return d_category;
    }
}

function elemIcon(name: string, onclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null = null) {
    const i = document.createElement('i');
    i.className = `fas ${name} fa-sm`;
    i.onclick = onclick;
    return i;
}

function filterSearch(categories: DataCategory[], key: string) {
    const newCategory: DataCategory[] = [];
    for (const category of categories) {
        const newNotes: DataNote[] = [];
        for (const note of category.notes) {
            for (const content of note.contents) {
                if (new RegExp(key).test(content)) {
                    newNotes.push(note);
                    break;
                }
            }
        }
        if (newNotes.length >= 1) {
            newCategory.push({ name: category.name, notes: newNotes });
        }
    }
    return newCategory;
}

class VNDomain {
    search: boolean = false;
    categoriesDom = document.createElement('div');
    searchDom = this.createSerachDom();
    constructor(private readonly domain: DataDomain) {
        this.readerCategories();
    }

    createSerachDom() {
        const i = document.createElement('input');
        i.type = 'text';
        i.style.display = 'none';
        i.onkeydown = () => {
            this.readerCategories(i.value);
        };
        return i;
    }

    readerCategories(filter: string | undefined = undefined) {
        const _categories = this.search && filter ? filterSearch(this.domain.categories, filter) : this.domain.categories;
        this.categoriesDom.innerHTML = ''; // remove all child
        for (const c of _categories) {
            this.categoriesDom.appendChild(new VNCategory(c.name, c.notes).doms());
            this.categoriesDom.appendChild(document.createElement('p'));
        }
    }

    doms() {
        const e_domain = document.createElement('div');
        const e_title = document.createElement('h2');
        const e_domain_name = document.createElement('span');
        e_domain_name.textContent = this.domain.dpath.join(' / ');
        // const e_search = elemNotesSearch();
        e_title.appendChild(e_domain_name);
        e_title.appendChild(elemSpaces());
        e_title.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'add-category' })));
        e_title.appendChild(elemSpaces());
        e_title.appendChild(
            elemIcon('fa-search', () => {
                if (!this.search) {
                    this.search = true;
                    this.searchDom.style.display = 'block';
                } else {
                    this.search = false;
                    this.searchDom.style.display = 'none';
                    this.readerCategories();
                }
            })
        );
        e_title.appendChild(this.searchDom);

        e_domain.append(e_title, this.categoriesDom);
        return e_domain;
    }
}

document.addEventListener('click', () => nccm.elem?.remove());
document.addEventListener(
    'contextmenu',
    () => {
        nccm.close();
    },
    true
);

let domain;

window.addEventListener('message', (event) => {
    const message: DataProtocol = event.data;
    switch (message.command) {
        case 'data':
            domain = new VNDomain(message.data);
            document.getElementById('root')?.replaceChildren(domain.doms());
            break;
        default:
            document.body.innerHTML = '<h1>loading...{message}</h1>';
    }
});
