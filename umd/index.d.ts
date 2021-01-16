import { setConfig } from "./config";
import { CreateDbAndUserOpt } from "./createDbAndUser";
import { table } from "./table";
interface NoSchemaDb {
    free: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeFree: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    createDbAndUser: (opt: CreateDbAndUserOpt) => Promise<void>;
    table: typeof table;
    setFreeSQLConfig: typeof setConfig;
}
declare const freeSQL: <T>(connector: T) => NoSchemaDb & T;
export default freeSQL;
