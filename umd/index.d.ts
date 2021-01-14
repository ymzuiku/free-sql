import { setConfig } from "./config";
import { parseInsert } from "./parse";
import { createTableDetail } from "./createTableDetail";
import { onAfterAlterTable } from "./onAfterAlterTable";
import { onBeforeAlterTable } from "./onBeforeAlterTable";
import { onAfterCreateTable } from "./onAfterCreateTable";
import { CreateDbAndUserOpt } from "./createDbAndUser";
interface NoSchemaDb<T> {
    connector: T;
    query: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    insert: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    alter: (sql: string, sqlValue?: any[]) => void;
    alterBase: (sql: string, sqlValue?: any[]) => void;
    parseInsert: typeof parseInsert;
    createTableDetail: typeof createTableDetail;
    onAfterCreateTable: typeof onAfterCreateTable;
    onBeforeAlterTable: typeof onBeforeAlterTable;
    onAfterAlterTable: typeof onAfterAlterTable;
    setConfig: typeof setConfig;
    createDbAndUser: (opt: CreateDbAndUserOpt) => Promise<void>;
}
declare const freeSQL: <T>(connector: T) => NoSchemaDb<T>;
export default freeSQL;
