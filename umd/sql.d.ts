import { ParseSQL } from "./hepler";
export declare const autoAlter: (db: any, ast: ParseSQL) => Promise<void>;
export declare const autoTable: (db: any, ast: ParseSQL) => Promise<void>;
