import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import toDate from "date-fns/parse";
import getTime from "date-fns/get_time";

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

exports.newClient = functions.firestore
  .document("clients/{cid}")
  .onCreate((snap, context) => {
    const newValue = snap.data();
    const ts = newValue!.timestamp;
    const date = toDate(ts);
    date.setHours(0, 0, 0, 0);

    const analyzesRef = db.collection("analyzes").doc(getTime(date).toString());

    analyzesRef.get().then(snapshot => {
      const cnt = snapshot.exists ? snapshot.data()!.new : 0;
      analyzesRef
        .update({ new: cnt + 1 })
        .then(() => console.log(`new client counter increased!`));
    });
  });


exports.clientAction = functions.firestore
  .document("actions/{id}")
  .onCreate((snap, context) => {
    const newValue = snap.data();
    const ts = newValue!.timestamp;
    const date = toDate(ts);
    date.setHours(0, 0, 0, 0);
    const rangeTS = getTime(date);

    const action: string = newValue!.action;
    const analyzesRef = db.collection("analyzes").doc(rangeTS.toString());

    analyzesRef.get().then(snapshot => {
      const o: { [action: string]: number } = {};
      if (snapshot.exists || !snapshot.data()![action]) {
        if (snapshot.data()![action]) {
          o[action] = snapshot.data()![action] + 1;
          analyzesRef
            .update(o)
            .then(() => console.log("Incomers counter increased!"));
        }
      } else {
        o[action] = 1;
        analyzesRef
          .update(o)
          .then(() => console.log("Incomers counter increased!"));
      }
    });
  });
