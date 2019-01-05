import * as db from '../src/database';

const vscodeDB = new db.VSNoteDatabase("./test");

test('true', () => {
    expect(vscodeDB.existChildDomain("/powershell")).toBe(true);
});

test('false', () => {
    expect(vscodeDB.existChildDomain("/oracle")).toBe(false);
});