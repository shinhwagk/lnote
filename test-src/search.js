

const text1 = "我要回家";
const text2 = "i go home";

const str = '起来 我饭';
const st1r = '起来 飞饭';
const st2r = 'adfsdfd部署啊多发点吃1';


const key = '我'
const regex = new RegExp(`部署`);

// console.log(regex.test(text1));
// Expected output: true

// console.log(regex.exec(str));
// console.log(regex.exec(st1r));
// console.log(regex.test(st2r));
// // Expected output: false



const notess = []

const fs = require('fs')
const path = require('path')
for (const i of fs.readdirSync('F:\\OneDrive\\vscode-note-data\\lnote-data-20221010')) {
    const notes = fs.statSync(path.join('F:\\OneDrive\\vscode-note-data\\lnote-data-20221010', i))
    if (notes.isDirectory()) {
        const ns = JSON.parse(fs.readFileSync(path.join('F:\\OneDrive\\vscode-note-data\\lnote-data-20221010', i, 'notes.json')))
        for (const [k, v] of Object.entries(ns))
            notess.push({ k, v })
    }
}

for (const i of [1, 2, 3]) {
    const _s = (new Date()).getTime()

    let liu = []
    let cnt = 0
    for (const { k, v } of notess) {
        cnt += 1
        // const cs = v.contents.concat(v.labels).join('')
        // const x = cs.filter(c => ).length
        const contentOfNote = v.contents.join(' |\| ');

        const match = ['guard', 'oracle'].map(kw => new RegExp(kw)).filter(re => re.test(contentOfNote))
        if (match.length === 2) {
            liu.push(v);
        }
        // console.log(k)
    }
    console.log('ss', liu,)
    console.log((new Date()).getTime() - _s, cnt);

}
const used = process.memoryUsage().heapUsed / 1024 / 1024;
console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);

const used1 = process.memoryUsage();
console.log(used1)
for (let key in used1) {
    console.log(`${key} ${Math.round(used1[key] / 1024 / 1024 * 100) / 100} MB`);
}