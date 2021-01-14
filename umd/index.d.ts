import { setConfig } from "./config";
import { CreateDbAndUserOpt } from "./createDbAndUser";
import { useIndex } from "./useIndex";
import { useType } from "./useType";
interface NoSchemaDb {
    free: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeFree: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    createDbAndUser: (opt: CreateDbAndUserOpt) => Promise<void>;
    useIndex: typeof useIndex;
    useType: typeof useType;
    setFreeSQLConfig: typeof setConfig;
}
declare const freeSQL: <T>(connector: T) => NoSchemaDb & T;
export default freeSQL;
