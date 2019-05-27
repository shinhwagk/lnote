import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import toDate from "date-fns/parse";
import getTime from "date-fns/get_time";
import subDays from "date-fns/sub_days";
admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

const analyzesRef = db.collection("analyzes");

exports.charts = functions.https.onRequest(async (req, res) => {
  const cd = new Date();
  cd.setHours(0, 0, 0, 0);
  const daysTs = Array.from({ length: 30 })
    .map((_c, i) => i)
    .map(d => subDays(cd, d))
    .map(d => getTime(d))
    .reverse()
    .map(ts =>
      db
        .collection("analyzes")
        .doc(ts.toString())
        .get()
    );

  res.setHeader("content-type", "application/json");
  // analyzesRef.orderBy("id", "desc");
  if (req.path === "/new") {
    res.send(
      (await Promise.all(daysTs)).map(doc =>
        doc.exists ? doc.data()!.new || 0 : 0
      )
    );
  } else if (req.path === "/active") {
    res.send(
      (await Promise.all(daysTs)).map(doc =>
        doc.exists ? doc.data()!.active || 0 : 0
      )
    );
  } else if (req.path === "/notes") {
    res.send(
      (await Promise.all(daysTs)).map(doc =>
        doc.exists ? doc.data()!.notes || 0 : 0
      )
    );
  } else {
    res.send(
      Array.from({ length: 30 })
        .map((_c, i) => i)
        .map(d => subDays(cd, d))
        .map(d => getTime(d))
    );
  }
});

exports.newClient = functions.firestore
  .document("clients/{cid}")
  .onCreate((snap, context) => {
    const newValue = snap.data();
    const ts = newValue!.timestamp;
    const date = toDate(ts);
    date.setHours(0, 0, 0, 0);

    const analyzesTSRef = analyzesRef.doc(getTime(date).toString());

    analyzesTSRef.get().then(snapshot => {
      if (snapshot.exists) {
        const cnt = snapshot.exists ? snapshot.data()!.new : 0;
        if (snapshot.data()!.new) {
          analyzesTSRef
            .update({ new: cnt + 1 })
            .then(() => console.log(`new client counter increased!`));
        } else {
          analyzesTSRef
            .update({ new: 1 })
            .then(() => console.log(`new client counter increased!`));
        }
      } else {
        analyzesTSRef
          .set({ new: 1 })
          .then(() => console.log(`new client counter increased!`));
      }
    });
  });

exports.clientAction = functions.firestore
  .document("actions/{id}")
  .onCreate((snap, context) => {
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
          analyzesTSRef
            .update(o)
            .then(() => console.log("Incomers counter increased!"));
        } else {
          o[action] = 1;
          analyzesTSRef
            .update(o)
            .then(() => console.log("Incomers counter increased!"));
        }
      } else {
        o[action] = 1;
        analyzesTSRef
          .set({})
          .then(() => console.log("Incomers counter increased!"));
      }
    });
  });
