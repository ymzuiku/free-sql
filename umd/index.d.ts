import { table } from "./table";
import { columns } from "./columns";
interface FreeSQL {
    free: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeFree: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    safeOnceQuery: (sql: string, sqlValue?: any[]) => Promise<any[]>;
    table: typeof table;
    columns: typeof columns;
}
declare const freeSQL: <T>(connector: T) => FreeSQL & T;
export default freeSQL;
