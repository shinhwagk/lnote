export interface TestFileStructure {
    path: string;
    content?: string;
    kind: "d" | "f";
}