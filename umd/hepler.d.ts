export interface ParseSQL {
    type: string;
    db: string;
    table: string;
}
export declare const parseSQL: (sql: string) => ParseSQL;
