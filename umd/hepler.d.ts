export declare const lowSQL: (sql: string) => string;
export declare const getMatch: (str: string, reg: RegExp) => string;
export interface IColumn {
    operator?: string;
    value: any;
    type: string;
}
export interface ParseSQL {
    type: string;
    db: string;
    table: string;
    columns: {
        [key: string]: IColumn;
    };
}
export declare const parseSQLHelper: (sql: string) => ParseSQL;
