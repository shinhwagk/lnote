import * as fs from "fs";
import * as db from '../src/database';
import rimraf = require("rimraf");

let vscodeDB: db.VSNoteDatabase | undefined = undefined;

const testDataDomains = {
    powershell: {
        install: {},
        ".notes": [1, 2, 3]
    },
    oracle: {
        ".notes": []
    }
}
const testDataNote = {
    id: 1,
    contents: ["test", "select * from dual;"]
}

beforeAll(() => {
    fs.writeFileSync("./test/domains.json", JSON.stringify(testDataDomains), { encoding: "utf-8" });
    vscodeDB = new db.VSNoteDatabase("./test");

    fs.mkdirSync("./test/notes");
    fs.mkdirSync(`./test/notes/${testDataNote.id}`);
    fs.writeFileSync(`./test/notes/${testDataNote.id}/1.txt`, testDataNote.contents[0], { encoding: "utf-8" });
    fs.writeFileSync(`./test/notes/${testDataNote.id}/2.sql`, testDataNote.contents[1], { encoding: "utf-8" });
});

afterAll(() => {
    fs.unlinkSync("./test/domains.json");
    rimraf.sync("./test/notes");
});

test('true', () => {
    expect(vscodeDB!.existChildDomain("/powershell")).toBe(true);
});

test('false', () => {
    expect(vscodeDB!.existChildDomain("/oracle")).toBe(false);
});

test('dqual powershell notes', () => {
    expect(vscodeDB!.readNotesIdOfDomain('/powershell')).toEqual(testDataDomains.powershell[".notes"]);
});

test('dqual powershell notes', () => {
    expect(vscodeDB!.readNoteById(1)).toEqual(testDataNote);
});
