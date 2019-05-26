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
      if (snapshot.exists) {
        const cnt = snapshot.exists ? snapshot.data()!.new : 0;
        if (snapshot.data()!.new) {
          analyzesRef
            .update({ new: cnt + 1 })
            .then(() => console.log(`new client counter increased!`));
        } else {
          analyzesRef
            .update({ new: 1 })
            .then(() => console.log(`new client counter increased!`));
        }
      } else {
        analyzesRef
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
    const analyzesRef = db.collection("analyzes").doc(getTime(date).toString());

    analyzesRef.get().then(snapshot => {
      const o: { [action: string]: number } = {};
      if (snapshot.exists) {
        if (snapshot.data()![action]) {
          o[action] = snapshot.data()![action] + 1;
          analyzesRef
            .update(o)
            .then(() => console.log("Incomers counter increased!"));
        } else {
          o[action] = 1;
          analyzesRef
            .update(o)
            .then(() => console.log("Incomers counter increased!"));
        }
      } else {
        o[action] = 1;
        analyzesRef
          .set({})
          .then(() => console.log("Incomers counter increased!"));
      }
    });
  });
