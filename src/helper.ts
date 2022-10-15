// import * as path from 'path';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';

import * as fse from 'fs-extra';
import * as yaml from 'yaml';

import { pathSplit } from './constants';

export namespace vfs {
  const encoding = 'utf-8';
  export function readFileSync(file: string): string {
    return fse.readFileSync(file, { encoding });
  }

  export function writeFileSync(file: string, data: string = '') {
    return fse.writeFileSync(file, data, { encoding });
  }

  export function writeJsonSync(file: string, obj: any) {
    fse.writeJsonSync(file, obj, { encoding });
  }

  export function readJsonSync<T>(file: string): T {
    return fse.readJsonSync(file, { encoding }) as T;
  }
  export function removeSync(file: string) {
    fse.removeSync(file);
  }
  // export function ensureFileSync(file: string) {
  //     if (fse.existsSync(file)) return;
  //     if (fse.existsSync(path.dirname(file))) {
  //         vfs.writeFileSync(file, '');
  //     } else {
  //     }
  // }
}

export namespace tools {
  export function stringArrayEqual(a1: string[], a2: string[]) {
    return JSON.stringify(a1) === JSON.stringify(a2);
  }

  export function hexRandom(len: number): string {
    return randomBytes(len).toString('hex');
  }

  export const intersections = (array1: string[], array2: string[]) => array1.filter((e) => array2.indexOf(e) !== -1);

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
    fse.writeFileSync(path, yaml.stringify(data), { encoding: 'utf8' });
  }

  export function duplicateRemoval(arr: string[]): string[] {
    return [...new Set(arr)];
  }

  export function elementRemoval(arr: string[], elm: string): string[] {
    return arr.filter(e => e !== elm);
  }
}
