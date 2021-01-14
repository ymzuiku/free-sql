import { setConfig } from "./config";
import { CreateDbAndUserOpt } from "./createDbAndUser";
import { useTableHook } from "./useTableHook";
import { useAlterHook } from "./useAlterHook";
interface NoSchemaDb {
    free: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeFree: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    createDbAndUser: (opt: CreateDbAndUserOpt) => Promise<void>;
    useTableHook: typeof useTableHook;
    useAlterHook: typeof useAlterHook;
    setFreeSQLConfig: typeof setConfig;
}
declare const freeSQL: <T>(connector: T) => NoSchemaDb & T;
export default freeSQL;
