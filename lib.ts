import * as admin from "firebase-admin";
import { readdirSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

interface VSClinet {
  cid: string;
  info: { [name: string]: string };
  timestamp: number;
  version: string;
}
interface VSAction {
  cid: string;
  action: string;
  timestamp: number;
  version: string;
}

namespace Firestore {
  const serviceAccountKey = process.env.SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.error(`env SERVICE_ACCOUNT_KEY no exist.`);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountKey!))
  });

  const db = admin.firestore();

  const cActions = db.collection("actions");
  const cClients = db.collection("clients");

  export function addAction(data: any) {
    return cActions.add(data);
  }

  export function addClients(data: VSClinet) {
    const docRef = cClients.doc(data.cid);
    return docRef.set(data);
  }
}

namespace Storage2file {
  export const dirpath = "./storage2file";
  export async function deleteFile(file: string) {
    unlinkSync(join(dirpath, file));
  }
  export async function readFile(file: string): Promise<string> {
    return readFileSync(join(Storage2file.dirpath, file), {
      encoding: "utf-8"
    });
  }
}

// tslint:disable-next-line: no-namespace
namespace StorageToFirestore {
  let count = 0;

  export async function main() {
    for (const file of readdirSync(Storage2file.dirpath)) {
      if (file === "timestamp") {
        continue;
      }
      console.log(`process ${file}.`);
      try {
        const obj = JSON.parse(await Storage2file.readFile(file));
        if (isClient(obj)) {
          await Firestore.addClients(obj);
          await Storage2file.deleteFile(file);
          count += 1;
          console.log(`file ${file} upload. total count: ${count}`);
        }
        if (isAction(obj)) {
          await Firestore.addAction(obj);
          await Storage2file.deleteFile(file);
          count += 1;
          console.log(`file ${file} upload. total count: ${count}`);
        }
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }

    function isClient(object: any): object is VSClinet {
      return (
        "cid" in object &&
        "info" in object &&
        "timestamp" in object &&
        "version" in object
      );
    }

    function isAction(object: any): object is VSAction {
      return (
        "cid" in object &&
        "action" in object &&
        "timestamp" in object &&
        "version" in object
      );
    }
  }
}

export default StorageToFirestore.main;
