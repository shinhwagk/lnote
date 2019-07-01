[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/shinhwagk.vscode-note.svg)](https://marketplace.visualstudio.com/items?itemName=shinhwagk.vscode-note)

# vscode-note

This extension provides a simple note-taking. Make notes closer to the vscode extension ecosystem.

## Features

- Fast and easy to record and view and modify notes
- Simply organize files(Project)
- Cloud sync by OneDrive : \)

## Concepts

- each **_domain_**(directory tree) node can be a **_notes_**.
- each **_notes_** consists of one or more **_category_**.
- each **_category_** consists of one or more **_note_**.
- each **_note_** consists of one or more **_short doc_**, **_doc_**(markdown/html), **_files_**(attachment)

## Usages

![demo](https://github.com/shinhwagk/vscode-note/raw/vscode-note/images/my.jpg)

## modify data directory
Ctrl(Command) + p -> enter "open settings(json)" -> append below:
```json
{
  "vscode-note.dbpath": "D:\\OneDrive\\vscode-note-data", // default: ~/vscode-note
}
```