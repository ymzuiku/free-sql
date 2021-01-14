import { ParseSQL } from "./hepler";
export declare const createTableColumns: (name: string) => string[];
export declare const createTable: (name: string) => string;
export declare const autoAlter: (db: any, ast: ParseSQL) => Promise<void>;
export declare const autoTable: (db: any, table: string) => Promise<void>;
