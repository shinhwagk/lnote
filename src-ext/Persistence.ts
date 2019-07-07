import { ExtensionContext } from "vscode";
import { IPersistence } from "./moduls/IPersistence"

export class ExtPersistence<T> implements IPersistence<T> {
    clean(): void {
        this.context.globalState.update(this.name, 'a');
    }
    get(defaultValue: T): T;
    get(): T | undefined;
    get(defaultValue?: any) {
        if (defaultValue) {
            return this.context.globalState.get<T>(this.name, defaultValue)
        } else {
            return this.context.globalState.get<T>(this.name)
        }
    }

    constructor(readonly context: ExtensionContext, readonly name: string) { }
    update(value: any): void {
        this.context.globalState.update(this.name, value)
    }
    // get(defaultValue?: T): T | undefined {
    //     return this.context.globalState.get<T>(this.name, defaultValue)
    // }
}


