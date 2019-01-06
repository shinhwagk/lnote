import * as fs from "fs";
import * as db from '../src/database';

let vscodeDB: db.VSNoteDatabase | undefined = undefined;

const testData = {
    powershell: {
        install: {},
        ".notes": [1, 2, 3]
    },
    oracle: {
        ".notes": []
    }
}

beforeAll(() => {
    fs.writeFileSync("./test/domains.json", JSON.stringify(testData), { encoding: "utf-8" });
    vscodeDB = new db.VSNoteDatabase("./test");

    fs.mkdirSync("./test/notes");
    fs.mkdirSync("./test/notes/1");
    fs.writeFileSync("./test/notes/1/1", "test", { encoding: "utf-8" });
    fs.writeFileSync("./test/notes/1/2.sql", "select * from dual;", { encoding: "utf-8" });
});

test('true', () => {
    expect(vscodeDB!.existChildDomain("/powershell")).toBe(true);
});

test('false', () => {
    expect(vscodeDB!.existChildDomain("/oracle")).toBe(false);
});

test('dqual powershell notes', () => {
    expect(vscodeDB!.readNotesIdOfDomain('/powershell')).toEqual(testData.powershell[".notes"]);
});

afterAll(() => {
    fs.unlinkSync("./test/domains.json");
    fs.unlinkSync("./test/notes");
});