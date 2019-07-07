export interface IPersistence<T> {
    update(value: any): void
    get(defaultValue: T): T
    get(): T | undefined
}


export interface CreatePersisitence<T> {
    (name: string): IPersistence<T>
}