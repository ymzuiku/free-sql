export declare const lowSQL: (sql: string) => string;
export declare const getMatch: (str: string, reg: RegExp) => string;
export declare const getColMap: (type: "insert" | "update" | "select", db: any, str: string) => Promise<{
    colMap: {
        [key: string]: string;
    };
    table: string;
    values: any;
    columns: any;
}>;
