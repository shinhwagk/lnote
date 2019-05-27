import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import getTime from 'date-fns/get_time';
import subDays from 'date-fns/sub_days';
import addDays from 'date-fns/add_days';
import toDate from 'date-fns/parse';

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

const analyzesRef = db.collection('analyzes');

exports.charts = functions.https.onRequest(async (req, res) => {
    const cd = new Date();
    cd.setHours(0, 0, 0, 0);
    const last30DaysTime = Array.from({ length: 30 })
        .map((_c, i) => i)
        .map(d => subDays(cd, d))
        .map(d => getTime(d))
        .reverse();
    const newDocsRefs = last30DaysTime.map(ts =>
        db
            .collection('clients')
            .orderBy('timestamp', 'desc')
            .where('timestamp', '>=', ts)
            .where('timestamp', '<', getTime(addDays(ts, 1))),
    );

    const notesDocsRefs = last30DaysTime.map(ts =>
        db
            .collection('actions')
            .orderBy('timestamp', 'desc')
            .where('action', '==', 'note-add')
            .where('timestamp', '>=', ts)
            .where('timestamp', '<', getTime(addDays(ts, 1))),
    );

    const activeDocsRefs = last30DaysTime.map(ts =>
        db
            .collection('actions')
            .orderBy('timestamp', 'desc')
            .where('action', '==', 'active')
            .where('timestamp', '>=', ts)
            .where('timestamp', '<', getTime(addDays(ts, 1))),
    );

    res.setHeader('content-type', 'application/json');
    if (req.path === '/new') {
        res.send((await Promise.all(newDocsRefs.map(d => d.get()))).map(docs => docs.size));
    } else if (req.path === '/active') {
        res.send((await Promise.all(activeDocsRefs.map(d => d.get()))).map(docs => docs.size));
    } else if (req.path === '/notes') {
        res.send((await Promise.all(notesDocsRefs.map(d => d.get()))).map(docs => docs.size));
    } else {
        res.send(
            Array.from({ length: 30 })
                .map((_c, i) => i)
                .map(d => subDays(cd, d))
                .map(d => getTime(d)),
        );
    }
});

exports.newClient = functions.firestore.document('clients/{cid}').onCreate((snap, context) => {
    const newValue = snap.data();
    const ts = newValue!.timestamp;
    const date = toDate(ts);
    date.setHours(0, 0, 0, 0);

    const analyzesTSRef = analyzesRef.doc(getTime(date).toString());

    analyzesTSRef.get().then(snapshot => {
        if (snapshot.exists) {
            const cnt = snapshot.exists ? snapshot.data()!.new : 0;
            if (snapshot.data()!.new) {
                analyzesTSRef.update({ new: cnt + 1 }).then(() => console.log(`new client counter increased!`));
            } else {
                analyzesTSRef.update({ new: 1 }).then(() => console.log(`new client counter increased!`));
            }
        } else {
            analyzesTSRef.set({ new: 1 }).then(() => console.log(`new client counter increased!`));
        }
    });
});

exports.clientAction = functions.firestore.document('actions/{id}').onCreate((snap, context) => {
    const newValue = snap.data();
    const ts = newValue!.timestamp;
    const date = toDate(ts);
    date.setHours(0, 0, 0, 0);

    const action: string = newValue!.action;
    const analyzesTSRef = analyzesRef.doc(getTime(date).toString());

    analyzesTSRef.get().then(snapshot => {
        const o: { [action: string]: number } = {};
        if (snapshot.exists) {
            if (snapshot.data()![action]) {
                o[action] = snapshot.data()![action] + 1;
                analyzesTSRef.update(o).then(() => console.log('Incomers counter increased!'));
            } else {
                o[action] = 1;
                analyzesTSRef.update(o).then(() => console.log('Incomers counter increased!'));
            }
        } else {
            o[action] = 1;
            analyzesTSRef.set({}).then(() => console.log('Incomers counter increased!'));
        }
    });
});
