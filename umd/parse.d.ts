export declare const lowSQL: (sql: string) => string;
export declare const getMatch: (str: string, reg: RegExp) => string;
export declare const parseInsert: (str: string) => {
    table: string;
    columns: string[];
    values: any;
};
export declare const getColMap: (db: any, str: string) => Promise<{
    colMap: {
        [key: string]: string;
    };
    table: string;
    values: any;
    columns: string[];
}>;
