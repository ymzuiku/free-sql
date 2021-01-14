import { setConfig } from "./config";
import { createDbAndUser } from "./createDbAndUser";
import { onCreateTableDetail } from "./onCreateTableDetail";
interface NoSchemaDb {
    free: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    alter: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeFree: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    createDbAndUser: typeof createDbAndUser;
    onCreateTableDetail: typeof onCreateTableDetail;
    setFreeSQL: typeof setConfig;
}
declare const freeSQL: <T>(connector: T) => NoSchemaDb & T;
export default freeSQL;
