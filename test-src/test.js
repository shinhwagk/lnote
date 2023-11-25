// const a = [[1, 2, 3], [1, 2], [1], [1, 2, 4]]
const issubset = (child, father) => child.filter((e) => father.indexOf(e) !== -1).length === child.length;

const chaji = (child, father) => child.filter((e) => father.indexOf(e) == -1);
const intersections = (array1, array2) => array1.filter((e) => array2.indexOf(e) !== -1);


// console.log(chaji([1, 2, 3], [1, 2],))

// for (const a1 of a) {
//     let f = true
//     for (const a2 of a) {
//         if (a1.join("") !== a2.join("")) {
//             if (issubset(a1, a2)) {
//                 f = false
//             }
//         }
//     }
//     if (f) {
//         console.log(a1)
//     }
// }


const abc = {
    "a|||b|||c|||x": [1, 2, 3],
    "a|||b|||x": [1, 2, 3, 8],
    "a|||b|||c": [1, 2, 3],
    "f|||b|||c": [1, 4]
}

for (const a1 of Object.keys(abc).map(f => f.split("|||"))) {
    for (const a2 of Object.keys(abc).map(f => f.split("|||"))) {
        if (a1.join("") !== a2.join("")) {
            if (issubset(a1, a2)) {
                const chaj = chaji(abc[a1.join("|||")], abc[a2.join("|||")])
                abc[a1.join("|||")] = chaj
            }
        }
    }
    if (abc[a1.join("|||")].length == 0) {
        delete abc[a1.join("|||")]
    }
}

console.log(abc)