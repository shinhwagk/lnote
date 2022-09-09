[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/shinhwagk.vscode-note.svg)](https://marketplace.visualstudio.com/items?itemName=shinhwagk.vscode-note)

# vscode-note

This extension provides a simple note-taking. Make notes closer to the vscode extensions.

## Concepts

- each **_notebook_** (or tree) node can be a **_notes_**.
- each **_notes_** consists of one or more **_category_**.
- each **_category_** consists of one or more **_note_**.
- each **_note_** consists of one or more **_short doc_**, **_doc_**(markdown), **_files_**(attachment)


### Modify notes data directory location -> vscode global settings.json
```json
{
  "vscode-note.notespath": "D:\\OneDrive\\vscode-note-data",
}
```
- strongly recommend use onedrive(similar products) to store/sync your notes data.

## Usage
![usage](https://raw.githubusercontent.com/shinhwagk/vscode-note/master/images/usage.gif)