import { ParseSQL } from "./hepler";
export declare const createTableColumns: (name: string) => string[];
export declare const autoAlter: (db: any, ast: ParseSQL) => Promise<void>;
export declare const createTable: (ast: ParseSQL) => string;
export declare const autoTable: (db: any, ast: ParseSQL) => Promise<void>;
