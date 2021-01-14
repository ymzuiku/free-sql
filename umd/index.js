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
        autoDropTable: {},
    };
    const setConfig = (next) => {
        Object.assign(config, next);
    };

    const isDate = (str) => {
        return isNaN(Number(str)) && !isNaN(Date.parse(str));
    };
    const lowSQL = (sql) => {
        let low = sql.toLocaleLowerCase();
        low = low.replace(/   /g, " ");
        low = low.replace(/\n/g, " ");
        low = low.replace(/  /g, " ");
        return low;
    };
    const getMatch = (str, reg) => {
        const match = str.match(reg);
        if (match && match[1]) {
            return match[1].trim();
        }
        return "";
    };
    const parse = {
        insert: (str) => {
            let table = getMatch(str, /into(.+?)\(/);
            table = table.replace(/\`/g, "");
            let columns = getMatch(str, new RegExp(`${table}(.+?)values`));
            columns = columns.replace(/(\`|\(|\))/g, "");
            columns = columns.split(",").map((v) => v.trim());
            let values = getMatch(str, /values(.+?)\)/);
            values = values.replace(/(\(|\))/g, "");
            values = values.split(",").map((v) => v.trim());
            return { table, columns, values };
        },
        update: (str) => {
            // update table set name=''
            let table = getMatch(str, /update (.+?) set/);
            table = table.replace(/\`/g, "");
            let columns = getMatch(str, new RegExp(`${table}(.+?)values`));
            columns = columns.replace(/(\`|\(|\))/g, "");
            columns = columns.split(",").map((v) => v.trim());
            let values = getMatch(str, /values(.+?)\)/);
            values = values.replace(/(\(|\))/g, "");
            values = values.split(",").map((v) => v.trim());
            return { table, columns, values };
        },
        select: (str) => {
            let table = getMatch(str, /into(.+?)\(/);
            table = table.replace(/\`/g, "");
            let columns = getMatch(str, new RegExp(`${table}(.+?)values`));
            columns = columns.replace(/(\`|\(|\))/g, "");
            columns = columns.split(",").map((v) => v.trim());
            let values = getMatch(str, /values(.+?)\)/);
            values = values.replace(/(\(|\))/g, "");
            values = values.split(",").map((v) => v.trim());
            return { table, columns, values };
        },
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
    const getColMap = (type, db, str) => __awaiter(void 0, void 0, void 0, function* () {
        const { table, columns, values } = parse[type](str);
        const colMap = {};
        columns.forEach((k, i) => {
            let v = values[i];
            let isNumber = false;
            if (!/(\"|\')/.test(v)) {
                isNumber = true;
            }
            v = v.replace(/(\"|\')/g, "");
            let kind = "VARCHAR(128)";
            if (v === "true" || v === "false") {
                kind = "TINYINT";
            }
            else if (isNumber) {
                if (v.indexOf(".") > -1) {
                    kind = config.focusDoubleType || "FLOAT";
                }
                else {
                    kind = "INT";
                }
            }
            else if (isDate(v)) {
                kind = config.focusTimeType || "DATETIME";
            }
            else {
                const len = Math.max(getVarcharLenth(v.length * (config.varcharRate || 4)), config.varcharMinLength || 128);
                if (len < 65535) {
                    kind = `VARCHAR(${len})`;
                }
                else {
                    kind = `TEXT`;
                }
            }
            colMap[k] = kind;
        });
        if (db) {
            const keySet = new Set(columns);
            const [list] = (yield db.query("show full columns from " + table));
            list.forEach((item) => {
                const name = item.Field;
                if (keySet.has(name)) {
                    delete colMap[name];
                }
            });
        }
        return { colMap, table, values, columns };
    });

    const afterAlterTableCache = {};
    const onAfterAlterTable = (table, event) => {
        afterAlterTableCache[table] = event;
    };

    const createTableDetailCache = {};
    const createTableDetail = (table, columns) => {
        createTableDetailCache[table] = columns;
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
    const createTable = (name) => {
        const _create = createTableDetailCache[name] || [];
        const list = [...createTableColumns(name), ..._create];
        const line = list.join(`, `);
        return `create table if not exists ${name} (${line}) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
    };
    const useIndexTypes = {
        TIMESTAMP: 1,
        DATETIME: 1,
        INT: 1,
        TINYINT: 1,
    };
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
        return useIndexTypes[type];
    }
    const autoAlter = (db, table, colMap) => __awaiter(void 0, void 0, void 0, function* () {
        const columns = Object.keys(colMap);
        for (const column of columns) {
            const type = colMap[column];
            const sql = `alter table ${table} add column ${column} ${type} `;
            yield db.query(sql);
            const index = checkTypeUseIndex(table, type)
                ? `index ${column}(${column})`
                : "";
            if (index) {
                yield db.query(`alter table ${table} add index ${column}(${column})`);
            }
        }
        for (const column of columns) {
            const _alter = afterAlterTableCache[table + "." + column];
            if (_alter) {
                yield Promise.resolve(_alter());
            }
        }
    });
    const autoTable = (db, table) => __awaiter(void 0, void 0, void 0, function* () {
        yield db.query(createTable(table));
    });

    const cache = {};
    const alterReg = /alter(.+?)table(.+?)add/;
    const alter = function (connector, sql, sqlValues) {
        sql += ", ALGORITHM=INPLACE, LOCK = NONE;";
        return alterBase(connector, sql, sqlValues);
    };
    const alterBase = function (connector, sql, sqlValues) {
        let low = lowSQL(sql);
        if (cache[sql]) {
            return;
        }
        if (!alterReg.test(low) || !/(index|unique)/.test(low)) {
            throw "alter only run ALTER TABLE ADD INDEX/UNIQUE";
        }
        cache[sql] = 1;
        const start = () => __awaiter(this, void 0, void 0, function* () {
            const table = getMatch(low, /alter table (.+?) add/);
            const index = getMatch(low, /unique\((.+?)\)/) || getMatch(low, /add index(.+?)\(/);
            const [list] = yield connector.query("show index from " + table);
            if (index) {
                list.forEach((item) => {
                    if (item.Column_name === index) {
                        cache[sql] = 2;
                        return;
                    }
                });
            }
            try {
                yield connector.query(sql, sqlValues);
            }
            catch (error) {
                const err = error.toString();
                if (/Duplicate key name/.test(err)) {
                    cache[sql] = 2;
                }
                else {
                    console.error(err);
                    cache[sql] = 0;
                }
            }
        });
        start();
    };

    const beforeAlterTableCache = {};
    const onBeforeAlterTable = (table, event) => {
        beforeAlterTableCache[table] = event;
    };

    const afterCreateTableCache = {};
    const onAfterCreateTable = (table, event) => {
        afterCreateTableCache[table] = event;
    };

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

    const safeQuery = (db, sql, sqlValues) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const out = yield db.insert(sql, sqlValues);
            return out;
        }
        catch (err) {
            return [];
        }
    });

    const insertReg = /(insert into (.+?)values)/;
    const updateReg = /(update (.+?) set)/;
    const selectReg = /select (.+?) from/;
    const freeSQL = (connector) => {
        const db = connector;
        const free = (sql, sqlValues) => __awaiter(void 0, void 0, void 0, function* () {
            let err;
            try {
                const out = yield db.query(sql, sqlValues);
                return out;
            }
            catch (error) {
                err = error;
            }
            let low = lowSQL(sql);
            let sqlType;
            if (insertReg.test(low)) {
                sqlType = "insert";
            }
            else if (selectReg.test(low)) {
                sqlType = "select";
            }
            else if (updateReg.test(low)) {
                sqlType = "update";
            }
            else {
                throw err;
            }
            if (sqlValues) {
                sqlValues.forEach((v) => {
                    if (Object.prototype.toString.call(v) === "[object Date]") {
                        low = low.replace("?", '"' + v.toISOString() + '"');
                    }
                    if (typeof v === "string") {
                        if (low.split("?")[0].indexOf("values")) {
                            low = low.replace("?", '"' + v + '"');
                        }
                        else {
                            low = low.replace("?", "`" + v + "`");
                        }
                    }
                    else {
                        low = low.replace("?", v);
                    }
                });
            }
            const errStr = err.toString();
            if (/Unknown column/.test(errStr)) {
                // 自动创建列
                let { colMap, table, values, columns } = yield getColMap(sqlType, db, low);
                if (config.ignoreNoSchema) {
                    if (yield Promise.resolve(config.ignoreNoSchema({
                        type: "alteColumns",
                        error: err,
                        values,
                        columns,
                        sql,
                        sqlValues,
                        table,
                        colMap,
                    }))) {
                        throw err;
                    }
                }
                // 若有 befault，就先添加列
                const _beforeAlter = beforeAlterTableCache[table];
                if (_beforeAlter) {
                    yield Promise.resolve(_beforeAlter());
                    // 更新缺少的列
                    colMap = (yield getColMap(sqlType, db, low)).colMap;
                }
                // 添加剩余的列
                yield autoAlter(db, table, colMap);
                return free(sql, sqlValues);
            }
            if (/doesn\'t exist/.test(errStr) && /Table/.test(errStr)) {
                // 自动创建表 和 列
                let { colMap, table, values, columns } = yield getColMap(sqlType, null, low);
                if (config.ignoreNoSchema) {
                    if (yield Promise.resolve(config.ignoreNoSchema({
                        type: "createTable",
                        error: err,
                        values,
                        columns,
                        sql,
                        sqlValues,
                        table,
                        colMap,
                    }))) {
                        throw err;
                    }
                }
                yield autoTable(db, table);
                const { colMap: c2 } = yield getColMap(sqlType, db, low);
                yield autoAlter(db, table, c2);
                const _afterCreate = afterCreateTableCache[table];
                if (_afterCreate) {
                    yield Promise.resolve(_afterCreate());
                }
                return free(sql, sqlValues);
            }
            throw err;
        });
        const out = {
            free,
            query: (a, b) => connector.query(a, b),
            connector,
            safeQuery: (a, b) => safeQuery(free, a, b),
            onAfterAlterTable,
            onAfterCreateTable,
            onBeforeAlterTable,
            createTableDetail,
            setConfig,
            createDbAndUser: (opt) => createDbAndUser(out, opt),
            alter: (a, b) => alter(out, a, b),
            alterBase: (a, b) => alterBase(out, a, b),
        };
        return out;
    };

    return freeSQL;

}));
