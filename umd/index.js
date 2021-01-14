(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.freeSQL = factory());
}(this, function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    const config = {
        ignoreId: [],
        ignoreCreateAt: [],
        ignoreUpdateAt: [],
        ignoreAutoIndex: [],
    };
    const setConfig = (next) => {
        Object.assign(config, next);
    };

    const { Parser } = require("node-sql-parser/build/mysql");
    // export const parseAlterHelper = (sql: string) => {};
    const parseSQLHelper = (sql) => {
        const parse = new Parser();
        let ast;
        try {
            ast = parse.astify(sql);
        }
        catch (err) {
            throw err;
        }
        const type = ast.type;
        let details;
        let db;
        let table;
        try {
            if (type === "update" || type === "insert") {
                details = ast.table;
            }
            else if (type === "select") {
                details = ast.from;
            }
            db = details[0].db;
            table = details[0].table;
        }
        catch (err) {
            throw "[free-sql] error get table and db";
        }
        if (!table) {
            throw "[free-sql] error get table";
        }
        try {
            const columns = {};
            const isSelfTable = (table) => {
                if (!table) {
                    if (details.length === 1) {
                        return true;
                    }
                    return false;
                }
                const item = details[0];
                return item.table == table || item.as == table;
            };
            if (ast.set) {
                ast.set.forEach((item) => {
                    if (isSelfTable(item.table)) {
                        columns[item.column] = {
                            type: item.value.type,
                            value: item.value.value,
                        };
                    }
                });
            }
            const loadLeftAndRight = (obj) => {
                if (!obj) {
                    return;
                }
                if (!obj.left.column) {
                    loadLeftAndRight(obj.left);
                    loadLeftAndRight(obj.right);
                }
                else {
                    if (isSelfTable(obj.left.table)) {
                        if (obj.right.type !== "column_ref" && obj.right.value !== void 0) {
                            columns[obj.left.column] = {
                                operator: obj.operator,
                                type: obj.right.type,
                                value: obj.right.value,
                            };
                        }
                    }
                }
            };
            if (ast.where) {
                loadLeftAndRight(ast.where);
            }
            details.forEach((item) => {
                if (item.on) {
                    loadLeftAndRight(item.on);
                }
            });
            if (type === "insert") {
                if (ast.columns && ast.values && ast.values[0] && ast.values[0].value) {
                    ast.columns.forEach((k, i) => {
                        const v = ast.values[0].value[i];
                        if (v.value !== void 0) {
                            columns[k] = v;
                        }
                    });
                }
            }
            return { type, db, table, columns };
        }
        catch (err) {
            throw "[free-sql] parse error: " + sql;
        }
    };

    const isDate = (str) => {
        return isNaN(Number(str)) && !isNaN(Date.parse(str));
    };
    function getVarcharLenth(len) {
        const resize = (next) => {
            if (next > 65500) {
                return 65500;
            }
            if (len < next) {
                return next;
            }
            return resize(next * 2);
        };
        return resize(64);
    }
    const parseSQL = (db, str) => __awaiter(void 0, void 0, void 0, function* () {
        const ast = parseSQLHelper(str);
        const cols = Object.keys(ast.columns);
        cols.forEach((k) => {
            const item = ast.columns[k];
            if (item.type === "bool") {
                item.type = "TINYINT(1)";
            }
            else if (item.type === "string") {
                if (item.value === "true" || item.value === "false") {
                    item.type = "TINYINT(1)";
                }
                else if (isDate(item.value)) {
                    item.type = config.focusTimeType || "DATETIME";
                }
                else {
                    const len = Math.max(getVarcharLenth(item.value.length * (config.varcharRate || 4)), config.varcharMinLength || 128);
                    if (len < 65535) {
                        item.type = `VARCHAR(${len})`;
                    }
                    else {
                        item.type = `TEXT`;
                    }
                }
            }
            if (item.type === "number") {
                if (String(item.value).indexOf(".") > -1) {
                    item.type = config.focusDoubleType || "FLOAT";
                }
                else {
                    item.type = "INT";
                }
            }
        });
        if (db) {
            const keySet = new Set(Object.keys(ast.columns));
            const [list] = (yield db.query("show full columns from " + ast.table));
            list.forEach((item) => {
                const name = item.Field;
                if (keySet.has(name)) ;
            });
        }
        return ast;
    });

    const safeFree = (db, sql, sqlValues) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const out = yield db.free(sql, sqlValues);
            return out;
        }
        catch (err) {
            return [];
        }
    });
    const safeQuery = (db, sql, sqlValues) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const out = yield db.query(sql, sqlValues);
            return out;
        }
        catch (err) {
            return [];
        }
    });

    const useIndexCache = {};
    const useIndex = (table, query) => {
        if (typeof query === "string") {
            query = [query];
        }
        useIndexCache[table] = query.filter(Boolean);
    };

    const useTypeCache = {};
    const useType = (tableAndColumn, type) => {
        useTypeCache[tableAndColumn] = type;
    };

    const createTableColumns = (name) => {
        const id = config.primaryKey || "id";
        return [
            config.ignoreId.indexOf(name) === -1 &&
                `${id} int unsigned NOT NULL AUTO_INCREMENT`,
            config.ignoreCreateAt.indexOf(name) === -1 &&
                `create_at ${config.focusTimeType || "datetime"} DEFAULT CURRENT_TIMESTAMP`,
            config.ignoreUpdateAt.indexOf(name) === -1 &&
                `update_at ${config.focusTimeType || "datetime"} DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
            config.ignoreId.indexOf(name) === -1 && `primary key(${id})`,
        ].filter(Boolean);
    };
    const useIndexTypes = ["TIMESTAMP", "DATETIME", "INT", "TINYINT"];
    function checkTypeUseIndex(table, type) {
        if (config.ignoreAutoIndex.indexOf("*") === 0 ||
            config.ignoreAutoIndex.indexOf(table) > -1) {
            return false;
        }
        type = type.toLocaleUpperCase();
        if (type.indexOf("VARCHAR") > -1) {
            const match = type.match(/\((.+?)\)/);
            if (match && match[1]) {
                const len = Number(match[1].trim());
                if (len <= (config.varcharMinLength || 128)) {
                    return true;
                }
            }
            return false;
        }
        let isIndex = false;
        useIndexTypes.forEach((item) => {
            if (type.indexOf(item) === 0) {
                isIndex = true;
            }
        });
        return isIndex;
    }
    const autoAlter = (db, ast) => __awaiter(void 0, void 0, void 0, function* () {
        const columns = Object.keys(ast.columns);
        const table = ast.table;
        for (const column of columns) {
            const alterKey = ast.table + "." + column;
            const _sql = useTypeCache[alterKey];
            if (_sql) {
                yield db.query(`alter table ${table} add column ${column} ` + _sql);
            }
            else {
                const type = ast.columns[column].type;
                const sql = `alter table ${table} add column ${column} ${type} `;
                yield db.query(sql);
            }
        }
        const _indexs = useIndexCache[table] || [];
        for (const s of _indexs) {
            if (s.indexOf("unique(") > -1) {
                yield db.query(`alter table ${table} add ${s}`);
            }
            else {
                yield db.query(`alter table ${table} add ${s} , ALGORITHM=INPLACE, LOCK = NONE`);
            }
        }
        for (const column of columns) {
            const type = ast.columns[column].type;
            if (checkTypeUseIndex(table, type)) {
                yield db.safeQuery(`alter table ${table} add index ${column}(${column})`);
            }
        }
    });
    const createTable = (ast) => {
        const table = ast.table;
        const list = [...createTableColumns(table)];
        const line = list.join(`, `);
        return `create table if not exists ${table} (${line}) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
    };
    const autoTable = (db, ast) => __awaiter(void 0, void 0, void 0, function* () {
        yield db.query(createTable(ast));
    });

    function deleteUser(connector, user, host) {
        return __awaiter(this, void 0, void 0, function* () {
            const [old,] = yield connector.query("select user from mysql.user where user=? and host=?", [user, host]);
            if (old[0]) {
                try {
                    yield connector.query(`drop user '${user}'@'${host}'`);
                    // await db.query(sql`drop user #${user}@'%'`);
                }
                catch (err) {
                    if (err.toString().indexOf("Operation DROP USER") === -1) {
                        console.error(err);
                    }
                }
            }
        });
    }
    const userReg = /^[.a-zA-Z0-9_-]{4,40}$/;
    const hostReg = /^[%.a-zA-Z0-9_-]{1,40}$/;
    const passwordReg = /^.{8,40}$/;
    function createDbAndUser(connector, { host, dbName, user, password }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userReg.test(user)) {
                throw "user name is error";
            }
            if (!hostReg.test(host)) {
                throw "host is error";
            }
            if (!passwordReg.test(password)) {
                throw "password is error";
            }
            yield deleteUser(connector, user, host);
            try {
                yield connector.query(`create database ${dbName}`);
            }
            catch (err) {
                // if (err.toString().indexOf("database exists") === -1) {
                //   console.error(err);
                // }
            }
            yield connector.query(`create user '${user}'@'${host}' IDENTIFIED BY ?`, [
                password,
            ]);
            // await connector.query(`REVOKE all privileges on *.* to '${user}'@'${host}'`);
            yield connector.query(`flush privileges`);
            yield connector.query(`grant all privileges on ${dbName}.* to '${user}'@'${host}'`);
            yield connector.query(`flush privileges`);
        });
    }

    const sqlstring = require("sqlstring");
    const unknownColumn = /Unknown column/;
    const notExitsTable = /Table (.+?)doesn\'t exist/;
    const freeSQL = (connector) => {
        const db = connector;
        db.free = (sql, sqlValues) => __awaiter(void 0, void 0, void 0, function* () {
            let err;
            try {
                const out = yield db.query(sql, sqlValues);
                return out;
            }
            catch (error) {
                err = error;
            }
            const errString = err.toString();
            let low = sqlstring.format(sql, sqlValues);
            if (notExitsTable.test(errString)) {
                yield autoTable(db, yield parseSQL(null, low));
                yield autoAlter(db, yield parseSQL(db, low));
            }
            else if (unknownColumn.test(errString)) {
                yield autoAlter(db, yield parseSQL(db, low));
            }
            return yield db.query(sql, sqlValues);
        });
        db.safeFree = (a, b) => safeFree(db, a, b);
        db.safeQuery = (a, b) => safeQuery(db, a, b);
        db.useIndex = useIndex;
        db.useType = useType;
        db.createDbAndUser = (a) => createDbAndUser(db, a);
        db.setFreeSQLConfig = setConfig;
        return db;
    };

    return freeSQL;

}));
