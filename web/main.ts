interface vscode {
  postMessage(message: any): void;
}

declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;

namespace Tools {
  const splitter = '@!$';
  export function joinDomainNode(domain: string[]): string {
    return domain.join(splitter);
  }

  export function splitDomaiNode(domain: string): string[] {
    return domain.split(splitter);
  }
}

interface DataDomain {
  domainNode: string[];
  checkedLabels: string[];
  unCheckedLabels: string[];
  categories: DataCategory[];
  notes: PostNote[];
  note: PostNote
  labels: string[];
  domainLabels: string[];
  domainNotes: PostNote[];
  nId: string
}

interface DataCategory {
  name: string;
  labels: string[]
  notes: DataNote[];
}

interface DataNote {
  nId: string;
  contents: string[];
  doc: boolean;
  files: boolean;
  cDate: string;
  mDate: string;
}

interface DataProtocol {
  command: string;
  data: DataDomain;
}

interface PostNote {
  contents: string[];
  cts: number;
  mts: number;
  labels: string[];
  category: string;
  nId: string;
  doc: boolean;
  files: boolean;
}

interface ContextMenuAction {
  title: string;
  onClick: (data: any) => void;
}

const NoteEditContextMenuActions: ContextMenuAction[][] = [
  [
    {
      title: 'edit',
      onClick: (data) => vscode.postMessage({ command: 'notebook-note-edit', data: { nId: data.note.nId } })
    }
  ],
  [
    {
      title: 'create document',
      onClick: (data) => vscode.postMessage({ command: 'notebook-note-doc-create', data: { nId: data.note.nId } })
    },
    {
      title: 'create files',
      onClick: (data) => vscode.postMessage({ command: 'notebook-note-files-create', data: { nId: data.note.nId } })
    }
  ],
  [
    {
      title: 'remove',
      onClick: (data) => vscode.postMessage({ command: 'note-remove', data: { nId: data.note.nId } })
    }
  ]
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
      onClick: (data) => vscode.postMessage({ command: 'note-add', data: { labels: data.labels } })
    }
  ],
  [
    {
      title: 'edit labels',
      onClick: (data) => vscode.postMessage({ command: 'notes-edit-labels', data: { labels: data.labels, nIds: data.nIds } })
    }
  ],
  [
    {
      title: 'remove',
      onClick: (data) => vscode.postMessage({ command: 'notebook-domain-category-remove', data: { category: data.category } })
    }
  ]
];

const NoteColContextMenuActions: ContextMenuAction[][] = [
  [
    {
      title: 'edit short document',
      onClick: (data: any) => vscode.postMessage({ command: 'notebook-note-contents-edit', data: { nId: data.nId } })
    }
  ], [
    {
      title: 'delete short document',
      onClick: (data: any) => vscode.postMessage({ command: 'notebook-note-contents-remove', data: { nId: data.nId } })
    }
  ]
  // [
  //   {
  //     title: 'send to active terminal',
  //     onClick: (data: any) => vscode.postMessage({ command: 'col-to-terminal', data: { id: data.id, cidx: data.i } })
  //   },
  //   {
  //     title: 'send to active terminal with args',
  //     onClick: (_data: any) => {
  //       // new abc(context, e).show();
  //     } /* vscode.postMessage({ command: 'col-to-terminal-args', data: { id: nid, args: colIdx } } */
  //   }
  // ]
];

const DomainContextMenuActions: ContextMenuAction[][] = [
  [
    {
      title: 'relabels',
      onClick: (data: any) => vscode.postMessage({ command: 'domain-edit-labels', data })
    }
  ]
];

// class abc {
//     constructor(private readonly _context: string, e: MouseEvent) {
//         const f = document.createElement('form');
//         f.className = 'contextMenu';
//         const args1 = document.createElement('input');
//         args1.type = 'text' + this._context;
//         args1.name = 'args1';

//         const but = document.createElement('input');
//         but.type = 'button';
//         but.name = 'button';
//         f.appendChild(args1);
//         f.appendChild(but);
//         f!.style.display = 'block';
//         f!.style.position = 'absolute';
//         f!.style.top = e.pageY + 'px';
//         f!.style.left = e.pageX + 'px';
//         document.getElementById('root')?.appendChild(f);
//     }

//     show() { }
// }

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

function readerNote(container: HTMLElement, note: PostNote): void {
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

  d_note_id.appendChild(elemIcon(d_cion, () => vscode.postMessage({ command: 'notebook-note-doc-show', data: { nId: nid } })));
  d_note_id.appendChild(d_space);
  d_note_id.appendChild(elemIcon(f_cion, () => vscode.postMessage({ command: 'notebook-note-files-open', data: { nId: nid } })));

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


// class VNCategory {
//   constructor(private readonly labels: string, private readonly notes: DataNote[]) { }
//   doms() {
//     const d_category = document.createElement('div');
//     d_category.className = 'grid-category';

//     const d_category_name = document.createElement('div');
//     d_category_name.textContent = this.labels;
//     d_category_name.className = 'grid-category-name';
//     // d_category_name.ondblclick = () => vscode.postMessage({ command: 'edit-category', data: { category: this.name } })
//     // d_category_name.oncontextmenu = (e) => {
//     //     e.preventDefault();
//     //     // todo for rename
//     // };

//     d_category_name.appendChild(elemSpaces());
//     // d_category_name.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'add', data: this.name })));
//     d_category_name.appendChild(elemSpaces());
//     d_category_name.appendChild(
//       elemIcon('fa-pen', (ev: MouseEvent) => {
//         nccm.show(ev, d_category_name, CategoryEditContextMenuActions, { labels: this.labels.split(',').map(l => l.trim()), nIds: this.notes.map(n => n.nId) });
//       })
//     );
//     d_category_name.appendChild(elemSpaces());
//     // const d_category_labels = document.createElement('span');
//     // d_category_labels.style.fontSize = '10px';
//     // d_category_labels.textContent = this.labels.join(',');
//     // d_category_name.append(d_category_labels);

//     const d_category_body = document.createElement('div');
//     d_category_body.className = 'grid-category-body';

//     for (const n of this.notes) {
//       const d_n = new VNNote(n).dom();
//       d_category_body.appendChild(d_n);
//     }

//     d_category.append(d_category_name, d_category_body);
//     return d_category;
//   }
// }

// class VNLabel {
//   dom() {
//     const _labels = gs.checkedLabels.map(l => { return { label: l, checked: true }; });
//     if (!this.lock) {
//       gs.unCheckedLabels.filter(l => !gs.domainLabels.includes(l)).map(l => { return { label: l, checked: false }; }).forEach(l => _labels.push(l));
//     }
//     const labelDoms = [];
//     this.labelsDom.replaceChildren();
//     for (const label of gs.domainLabels) {
//       const d = document.createElement('label');
//       d.className = 'checkedLabel';
//       d.textContent = label;
//       labelDoms.push(d);
//       this.labelsDom.append(d, elemSpaces());
//     }

//     for (const { label, checked } of _labels) {
//       const d = document.createElement('label');
//       d.className = checked ? 'checkedLabel' : 'unCheckedLabel';
//       d.textContent = label;
//       d.onclick = () => {
//         d.className = d.className === 'unCheckedLabel' ? 'checkedLabel' : 'unCheckedLabel';
//         if (d.className === 'unCheckedLabel') {
//           gs.checkedLabels = gs.checkedLabels.filter(l => l !== label);
//         } else {
//           gs.checkedLabels.push(label);
//         }
//         this.readerNotes(gs.domainNotes, gs.checkedLabels.concat(gs.domainLabels));

//       };
//       labelDoms.push(d);
//       this.labelsDom.append(d, elemSpaces());
//     }
//   }

// }

// class VNDomain {
//   domainLabels: string[] = [];
//   checkedLabels: string[] = [];
//   unCheckedLabels: string[] = [];
//   domainNotes: PostNote[] = [];
//   domainNode: string[] = [];
//   search: boolean = false;
//   searchDom = this.createSerachDom();

//   labelsDom = document.createElement('div');
//   categoriesDom = document.createElement('div');

//   updateDomainLabels(domainLabels: string[]) {
//     this.domainLabels = domainLabels;
//   }

//   updateCheckedLabels(checkedLabels: string[]) {
//     this.checkedLabels = checkedLabels;
//   }

//   updateUnCheckedLabels(unCheckedLabels: string[]) {
//     this.unCheckedLabels = unCheckedLabels;
//   }

//   updateDomainNotes(domainNotes: PostNote[]) {
//     this.domainNotes = domainNotes;
//   }

//   updateDomainNode(domainNode: string[]) {
//     this.domainNode = domainNode;
//   }

//   createSerachDom() {
//     const i = document.createElement('input');
//     i.type = 'text';
//     i.style.display = 'none';
//     i.focus();
//     i.onkeydown = () => {
//       // this.readerCategories(i.value);
//     };
//     return i;
//   }

//   dom(): HTMLElement {
//     return document.createElement('a');
//   }

//   domainNameDom(domainNode: string[]) {
//     const e_domain = document.createElement('div');
//     const e_title = document.createElement('h2');
//     const e_domain_name = document.createElement('span');
//     e_domain_name.textContent = domainNode.join(' / ');
//     // const e_search = elemNotesSearch();
//     e_title.appendChild(e_domain_name);
//     e_title.appendChild(elemSpaces());
//     e_title.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'category-add' })));
//     e_title.appendChild(elemSpaces());
//     e_title.appendChild(elemIcon('fa-pen', () => vscode.postMessage({ command: 'domain-relabels', data: { labels: gs.checkedLabels } })));
//     e_title.appendChild(elemSpaces());
//     e_title.appendChild(
//       elemIcon('fa-search', () => {
//         if (!this.search) {
//           this.search = true;
//           this.searchDom.style.display = 'block';
//         } else {
//           this.search = false;
//           this.searchDom.style.display = 'none';
//         }
//       })
//     );
//     e_title.appendChild(this.searchDom);

//     // const labelsDom = document.createElement('div');
//     // labelsDom.id = 'domain-labels';
//     // const cc = new VNLabel()

//     // const categoriesDom = document.createElement('div');
//     // categoriesDom.id = 'domain-categories';


//     e_domain.append(e_title, this.labelsDom, document.createElement('br'), this.categoriesDom);
//     document.getElementById('content')?.replaceChildren(e_domain);
//   }
// }

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
      newCategory.push({ name: category.name, notes: newNotes, labels: category.labels });
    }
  }
  return newCategory;
}

// class VNNoteBook {
//   domainNode: string[] = [];
//   search: boolean = false;

//   categoriesDom = document.createElement('div');

//   lockDom = elemIcon('fa-lock');
//   lockOpenDom = elemIcon('fa-lock-open');
//   // checkedLabels: string[] = [];
//   // unCheckedLabels: string[] = [];
//   lock = true;
//   nIds: string[] = [];
//   // notes: PostNote[] = [];
//   constructor() {
//     // this.readerLabels();
//     // this.readerCategories();
//   }

//   // setDomainNode(domainNode: string[]) {
//   //   this.domainNode = domainNode;
//   // }

//   // setLabels(checkedLabels: string[], unCheckedLabels: string[]) {
//   //   gs.checkedLabels = checkedLabels;
//   //   gs.unCheckedLabels = unCheckedLabels;
//   // }

//   // setNotes()



//   readerTitle() {

//   }

//   readerLabels(checkedLabels: string[], unCheckedLabels: string[]) {
//     // this.domain.checkedLabels = checkedLabels;
//     // this.domain.unCheckedLabels = unCheckedLabels;
//     const _labels = checkedLabels.map(l => { return { label: l, checked: true }; });
//     // if (!this.lock) {
//     gs.unCheckedLabels.filter(l => !gs.domainLabels.includes(l)).map(l => { return { label: l, checked: false }; }).forEach(l => _labels.push(l));
//     // }
//     const labelDoms = [];
//     this.labelsDom.replaceChildren();
//     for (const label of gs.domainLabels) {
//       const d = document.createElement('label');
//       d.className = 'checkedLabel';
//       d.textContent = label;
//       labelDoms.push(d);
//       this.labelsDom.append(d, elemSpaces());
//     }

//     for (const { label, checked } of _labels) {
//       const d = document.createElement('label');
//       d.className = checked ? 'checkedLabel' : 'unCheckedLabel';
//       d.textContent = label;
//       d.onclick = () => {
//         d.className = d.className === 'unCheckedLabel' ? 'checkedLabel' : 'unCheckedLabel';
//         if (d.className === 'unCheckedLabel') {
//           gs.checkedLabels = gs.checkedLabels.filter(l => l !== label);
//         } else {
//           gs.checkedLabels.push(label);
//         }
//         this.readerNotes(gs.domainNotes, gs.checkedLabels.concat(gs.domainLabels));

//       };
//       labelDoms.push(d);
//       this.labelsDom.append(d, elemSpaces());
//     }
//     // labelDoms.forEach(l => this.labelsDom.append(l, elemSpaces()))
//   }

//   // readerCategories(filter: string | undefined = undefined) {
//   //   const _categories = this.search && filter ? filterSearch(this.categories, filter) : this.categories;
//   //   this.categoriesDom.innerHTML = ''; // remove all child
//   //   for (const c of _categories) {
//   //     this.categoriesDom.appendChild(new VNCategory(c.name, c.notes).doms());
//   //     this.categoriesDom.appendChild(document.createElement('p'));
//   //   }
//   // }

//   // interface INote {
//   //   contents: string[], cts: number, mts: number, labels: string[], category: string, nId: string
//   // }

//   // subset = (array1: string[], array2: string[]) => array1.filter((e) => array2.indexOf(e) !== -1);



//   readerNote(note: PostNote) {
//     // const d_n = new VNNote(this.labels, n).dom();
//   }







//   // doms() {
//   //   const e_domain = document.createElement('div');
//   //   const e_title = document.createElement('h2');
//   //   const e_domain_name = document.createElement('span');
//   //   e_domain_name.textContent = this.domainNode.join(' / ');
//   //   // const e_search = elemNotesSearch();
//   //   e_title.appendChild(e_domain_name);
//   //   e_title.appendChild(elemSpaces());
//   //   e_title.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'category-add' })));
//   //   e_title.appendChild(elemSpaces());
//   //   e_title.appendChild(elemIcon('fa-pen', () => vscode.postMessage({ command: 'domain-relabels', data: { labels: gs.checkedLabels } })));
//   //   e_title.appendChild(elemSpaces());
//   //   e_title.appendChild(
//   //     elemIcon('fa-search', () => {
//   //       if (!this.search) {
//   //         this.search = true;
//   //         this.searchDom.style.display = 'block';
//   //       } else {
//   //         this.search = false;
//   //         this.searchDom.style.display = 'none';
//   //       }
//   //     })
//   //   );
//   //   e_title.appendChild(this.searchDom);

//   //   e_domain.append(e_title, this.labelsDom, document.createElement('br'), this.categoriesDom);
//   //   return e_domain;
//   // }
// }

// function readerNote(container: HTMLElement, note: PostNote) {

// }

function readerCategory(fDom: Element, categoryName: string, domainNotes: PostNote[]) {
  // const localDom = document.getElementById(`domain-category-${categoryName.replace(' ', '')}`)!;

  const d_category = document.createElement('div');
  d_category.id = categoryName.replace(' ', '');
  d_category.className = 'grid-category';

  const d_category_name = document.createElement('div');
  d_category_name.textContent = categoryName;
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
      nccm.show(ev, d_category_name, CategoryEditContextMenuActions, { labels: categoryName.split(',').map(l => l.trim()), nIds: domainNotes.map(n => n.nId) });
    })
  );
  d_category_name.appendChild(elemSpaces());
  // const d_category_labels = document.createElement('span');
  // d_category_labels.style.fontSize = '10px';
  // d_category_labels.textContent = this.labels.join(',');
  // d_category_name.append(d_category_labels);

  const d_category_body = document.createElement('div');
  d_category_body.id = `category-body-${categoryName.replace(/\s/g, '')}`;
  d_category_body.className = 'grid-category-body';

  for (const n of domainNotes) {
    const noteDom = document.createElement('div');
    noteDom.id = `note-${n.nId}`;
    d_category_body.appendChild(noteDom);
    readerNote(noteDom, n);
  }

  d_category.append(d_category_name, d_category_body);
  fDom.append(d_category);
  // d_category.append(d_category_name, d_category_body);
  // return d_category;
}

function readerCategories() {
  const localDom = document.getElementById('domain-categories')!;
  localDom.replaceChildren();
  // this.nIds = domainNotes.map(n => n.nId);
  const categories: { [cname: string]: PostNote[] } = {};
  for (const note of gs.domainNotes.filter(n => intersection(n.labels, gs.checkedLabels).length === gs.checkedLabels.length)) {
    const cname = note.labels.filter(f => !gs.domainLabels.includes(f)).sort().join(', ');
    // const n = { nId: note.nId, contents: note.contents, cDate: note.cts.toString(), mDate: note.mts.toString(), doc: note.doc, files: note.files };
    if (cname in categories) {
      categories[cname].push(note);
    } else {
      categories[cname] = [note];
      // const cDom = document.createElement('div');
      // localDom.append(cDom)
      // cDom.id = `domain-category-${cname.replace(' ', '')}`;
    }
  }
  // const _categories = this.search && filter ? filterSearch(this.categories, filter) : this.categories;
  for (const [cname, notes] of Object.entries(categories)) {
    readerCategory(localDom, cname, notes);
    // document.getElementById(`domain-category-${cname.replace(' ', '')}`)?.append(document.createElement('p'));
  }
}

function readerLabels() {
  const localDom = document.getElementById('domain-labels')!;
  localDom.replaceChildren();

  const _labels = gs.checkedLabels.filter(l => !gs.domainLabels.includes(l)).map(l => { return { label: l, checked: true }; });
  gs.unCheckedLabels.filter(l => !gs.checkedLabels.includes(l)).map(l => { return { label: l, checked: false }; }).forEach(l => _labels.push(l));
  // const labelDoms = [];

  for (const label of gs.domainLabels) {
    const d = document.createElement('label');
    d.className = 'checkedLabel';
    d.textContent = label;
    // labelDoms.push(d);
    localDom.append(d, elemSpaces());
  }

  for (const { label, checked } of _labels) {
    const d = document.createElement('label');
    d.className = checked ? 'checkedLabel' : 'unCheckedLabel';
    d.textContent = label;
    d.onclick = () => {
      d.className = d.className === 'unCheckedLabel' ? 'checkedLabel' : 'unCheckedLabel';
      if (d.className === 'unCheckedLabel') {
        gs.checkedLabels = gs.checkedLabels.filter(l => l !== label);
      } else {
        gs.checkedLabels.push(label);
      }
      readerCategories();
    };
    // labelDoms.push(d);
    localDom.append(d, elemSpaces());
  }
}

function readerDomainName() {
  const e_domain = document.createElement('div');
  const e_title = document.createElement('h2');
  const e_domain_name = document.createElement('span');
  const e_search = document.createElement('input');
  e_search.type = 'text';
  e_search.style.display = 'none';
  e_search.focus();
  e_search.onkeydown = () => {
    // this.readerCategories(i.value);
  };

  e_domain_name.textContent = gs.domainNode.join(' / ');
  // const e_search = elemNotesSearch();
  e_title.appendChild(e_domain_name);
  e_title.appendChild(elemSpaces());
  e_title.appendChild(elemIcon('fa-plus', () => vscode.postMessage({ command: 'category-add' })));
  e_title.appendChild(elemSpaces());
  e_title.appendChild(elemIcon('fa-pen', () => vscode.postMessage({ command: 'domain-relabels', data: { labels: gs.checkedLabels } })));
  e_title.appendChild(elemSpaces());
  e_title.appendChild(
    elemIcon('fa-search', () => {
      if (!gs.search) {
        gs.search = true;
        e_search.style.display = 'block';
      } else {
        gs.search = false;
        e_search.style.display = 'none';
      }
    })
  );
  e_title.appendChild(e_search);

  // labels
  const labelsDom = document.createElement('div');
  labelsDom.id = 'domain-labels';

  // categories
  const categoriesDom = document.createElement('div');
  categoriesDom.id = 'domain-categories';

  e_domain.append(e_title, labelsDom, document.createElement('br'), categoriesDom);
  document.getElementById('content')?.replaceChildren(e_domain);
}


const intersection = (array1: string[], array2: string[]) => array1.filter((e) => array2.indexOf(e) !== -1);
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
  domainLabels: string[] = [];
  checkedLabels: string[] = [];
  unCheckedLabels: string[] = [];
  domainNotes: PostNote[] = [];
  domainNode: string[] = [];
  search: boolean = false;
}

// const vnDomain = new VNDomain();

const gs = new GlobalState();

const Constants = {
  domainNodeDom: document.createElement('div'),
  domainLabelsDom: document.createElement('div'),
  domainCategories: document.createElement('div'),
};

// function readerNoteLabels() {
// }

window.addEventListener('message', (event) => {
  const message: DataProtocol = event.data;
  console.log('view notes.', message);
  switch (message.command) {
    case 'post-data':
      gs.domainLabels = message.data.domainLabels;
      gs.domainNotes = message.data.domainNotes;
      gs.domainNode = message.data.domainNode;
      gs.checkedLabels = [];
      gs.unCheckedLabels = Array.from(new Set(gs.domainNotes.map(n => n.labels).flatMap(l => l).filter(l => !gs.domainLabels.includes(l))));

      readerDomainName();
      readerLabels();
      readerCategories();

      // vnDomain.updateDomainLabels(message.data.domainLabels);
      // vnDomain.updateDomainNotes(message.data.domainNotes);
      // vnDomain.updateDomainNode(message.data.domainNode);

      // document.getElementById('content')?.replaceChildren(vnDomain.dom());

      // readerCategories(gs.domainLabels, gs.domainNotes, gs.checkedLabels);
      // domain.readerNotes()
      // vscode.postMessage({ command: 'get-notes' });
      break;
    // case 'post-labels':
    //   domain.setLabels(message.data.checkedLabels, message.data.unCheckedLabels);
    //   domain.readerLabels();
    //   vscode.postMessage({ command: 'get-notes-by-labels', data: { checkedLabels: message.data.checkedLabels } });
    //   break;
    // case 'post-notes':
    //   console.log(message.data.notes);
    //   domain.unCheckedLabels = Array.from(new Set(message.data.notes.map(n => n.labels).flatMap(n => n))).sort();
    //   domain.readerLabels();
    //   domain.readerNotes(message.data.notes, gs.domainLabels);
    //   break;
    case 'delete-note':
      document.getElementById(`note-${message.data.nId}`)?.remove();
      break;
    case 'post-note':
      const el = document.getElementById(`note-${message.data.note.nId}`);
      if (el !== null) {
        readerNote(el, message.data.note);
      } else {
        const cname = message.data.note.labels.filter(l => !gs.domainLabels.includes(l)).sort().join(', ').replace(/\s/g, '');
        const noteDom = document.createElement('div');
        noteDom.id = `note-${message.data.note.nId}`;
        document.getElementById(`category-body-${cname}`)?.append(noteDom);
        readerNote(noteDom, message.data.note);
      }
      break;
    default:
      document.body.innerHTML = '<h1>loading...{message}</h1>';
  }
});
