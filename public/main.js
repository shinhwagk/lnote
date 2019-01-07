
window.addEventListener('message', event => {
    const vsndomain = event.data;
    const rootElement = document.getElementById('root')

    while (rootElement.firstChild) {
        rootElement.removeChild(rootElement.firstChild);
    }

    rootElement.appendChild(renderDomain(vsndomain))
})

function renderDomain(vsndomain) {
    const domainElement = document.createElement("div");

    const domainNameElement = document.createElement("h1")
    domainNameElement.innerText = vsndomain.name

    domainElement.appendChild(domainNameElement)
    vsndomain.categorys.forEach(category => domainElement.appendChild(renderCategory(category)));
    return domainElement
}

function renderCategory(category) {
    const categoryElement = document.createElement("div");
    const e = document.createElement("h3");
    e.innerText = category.name;

    const tableElement = document.createElement("table")
    tableElement.border = "1";
    tableElement.width = "100%";
    category.notes.forEach(note => {
        tableElement.appendChild(renderNote(note))
    });

    categoryElement.appendChild(e);
    categoryElement.appendChild(tableElement);
    return categoryElement
}

function renderNote(note) {
    const rowElement = document.createElement("tr");
    for (const content of note.contents) {
        const e = document.createElement("td");
        e.innerText = content
        rowElement.appendChild(e)
    }
    return rowElement;
}