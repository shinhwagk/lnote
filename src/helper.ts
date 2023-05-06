// import * as path from 'path';
import { randomBytes, createHash } from 'crypto';
import { readFileSync } from 'fs';

import * as fse from 'fs-extra';
import * as yaml from 'yaml';

import { jointMark, pathSplit } from './constants';
import { ArrayLabels, GroupLables } from './types';

export namespace vfs {
  const encoding = 'utf-8';
  export function readFileSync(file: string): string {
    return fse.readFileSync(file, { encoding });
  }

  export function writeFileSync(file: string, data: string = '') {
    return fse.writeFileSync(file, data, { encoding });
  }

  export function writeJsonSync(file: string, obj: any) {
    fse.writeJsonSync(file, obj, { encoding, spaces: "  ", replacer: undefined });
  }

  export function readJsonSync<T>(file: string): T {
    return fse.readJsonSync(file, { encoding }) as T;
  }
  export function removeSync(file: string) {
    fse.removeSync(file);
  }
}

export namespace tools {
  export function stringArrayEqual(a1: string[], a2: string[]) {
    return JSON.stringify(a1) === JSON.stringify(a2);
  }

  export function hexRandom(len: number): string {
    return randomBytes(len).toString('hex');
  }

  export const intersections = (array1: string[], array2: string[]) => array1.filter((e) => array2.indexOf(e) !== -1);

  export const issubset = (child: string[], father: string[]) => child.filter((e) => father.indexOf(e) !== -1).length === child.length;

  const splitter = pathSplit;
  export function joinDomainNode(domain: string[]): string {
    return domain.join(splitter);
  }

  export function splitDomaiNode(domain: string): string[] {
    return domain.split(splitter);
  }

  export function readYamlSync(path: string) {
    return yaml.parse(readFileSync(path, { encoding: 'utf8' }));
  }

  export function writeYamlSync(path: string, data: any) {
    fse.writeFileSync(path, yaml.stringify(data, { aliasDuplicateObjects: false }), { encoding: 'utf8' });
  }

  export function duplicateRemoval(arr: string[]): string[] {
    return [...new Set(arr)];
  }

  export function elementRemoval(arr: string[], elm: string): string[] {
    return arr.filter(e => e !== elm);
  }

  export function generateSixString(): string {
    return tools.hexRandom(3);
  }

  export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  export function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // export function sortGroupLables(obj1: GroupLables): GroupLables {
  //   return Object.keys(obj1).sort().reduce(
  //     (obj, key) => {
  //       obj[key] = obj1[key].sort();
  //       return obj;
  //     },
  //     {} as GroupLables
  //   );
  // }



  export function checkFileSame(f1: string, f2: string) {
    const fc1 = vfs.readFileSync(f1);
    const fc2 = vfs.readFileSync(f2);
    const fs1 = createHash('sha256').update(fc1).digest('hex');
    const fs2 = createHash('sha256').update(fc2).digest('hex');
    return fs1 === fs2;
  }
}

export namespace debug {
  export function print(message?: any, ...optionalParams: any[]) {
    console.log(message, optionalParams);
  }
}


/**
 * grouplabels:
 * {
 *   common: ["label1", "labels"]
 * }
 * 
 * arraylabels:
 * ["common->labels", "common->labels"]
 */
export function arrayLabels2GroupLabels(al: ArrayLabels): GroupLables {
  const tmpgl: { [g: string]: Set<string> } = {};
  for (const label of al) {
    const [g, l] = label.split(jointMark);
    if (g in tmpgl) {
      tmpgl[g].add(l);
    } else {
      tmpgl[g] = new Set([l]);
    }
  }
  return Object.fromEntries(Object.entries(tmpgl)
    .map((v) =>
      [v[0], Array.from(v[1])]
    ));
}

/**
* grouplabels:
* {
*   common: ["label1", "labels"]
* }
*/
export function groupLabels2ArrayLabels(gls: GroupLables): ArrayLabels {
  const labels = new Set<string>();
  for (const [g, ls] of Object.entries(gls)) {
    for (const l of ls) {
      labels.add(`${g}${jointMark}${l}`);
    }
  }
  return Array.from(labels);
}