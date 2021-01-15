(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('crypto')) :
    typeof define === 'function' && define.amd ? define(['crypto'], factory) :
    (global = global || self, global.freeSQL = factory(global.crypto));
}(this, function (crypto) { 'use strict';

    crypto = crypto && crypto.hasOwnProperty('default') ? crypto['default'] : crypto;

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

    const { Parser } = require("node-sql-parser/build/mysql");
    const parseSQL = (sql) => {
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
        if (type !== "update" && type !== "insert" && type !== "select") {
            throw "[free-sql] only declare: update insert select";
        }
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
        return { type, db, table };
    };

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

    const declareTableCache = {};
    // declare
    const table = (table, query) => {
        const list = new Set();
        query.forEach((item) => {
            if (typeof item === "string") {
                if (item) {
                    list.add(item);
                }
            }
            else {
                item.forEach((v) => {
                    if (v) {
                        list.add(v);
                    }
                });
            }
        });
        declareTableCache[table] = Array.from(list);
    };

    const autoAlter = (db, ast) => __awaiter(void 0, void 0, void 0, function* () {
        const table = ast.table;
        const _indexs = declareTableCache[table] || [];
        for (const s of _indexs) {
            const low = s.toLocaleLowerCase();
            if (/alter table/.test(low)) {
                yield db.safeQuery(s);
            }
            else {
                yield db.safeQuery(`alter table ${table} add ${s}`);
            }
        }
    });
    const autoTable = (db, ast) => __awaiter(void 0, void 0, void 0, function* () {
        const table = ast.table;
        const list = declareTableCache[table];
        const line = list.join(`, `);
        const sql = `create table if not exists ${table} (${line}) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
        yield db.query(sql);
    });

    const columns = {
        id: "id int unsigned NOT NULL AUTO_INCREMENT primary key",
        id_TINYINT: "id TINYINT unsigned NOT NULL AUTO_INCREMENT primary key",
        id_BIGINT: "id TINYINT unsigned NOT NULL AUTO_INCREMENT primary key",
        create_at: "create_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP",
        create_at_TIMESTAMP: "create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        update_at: "update_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        update_at_TIMESTAMP: "update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    };

    const sha256 = (str, slat = "base-slat") => {
        const obj = crypto.createHash("sha256");
        obj.update(str + (slat ? slat : ""));
        return obj.digest("hex");
    };
    const sqlstring = require("sqlstring");
    const cache = {};
    const safeOnceQuery = (db, sql, sqlValues) => __awaiter(void 0, void 0, void 0, function* () {
        if (!cache.runed) {
            db.table("free_sql_lock", ["id varchar(512) unique", db.columns.create_at]);
            cache.runed = true;
        }
        let low = sqlstring.format(sql, sqlValues);
        if (cache[low]) {
            return;
        }
        const id = sha256(low);
        const [list,] = yield db.free("select id from free_sql_lock where id=? limit 1", [id]);
        if (list.length) {
            return;
        }
        yield db.safeQuery(sql, sqlValues);
        yield db.safeQuery("insert into free_sql_lock (id) values (?)", id);
        cache[low] = true;
    });

    const sqlstring$1 = require("sqlstring");
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
            let low = sqlstring$1.format(sql, sqlValues);
            if (notExitsTable.test(errString)) {
                yield autoTable(db, parseSQL(low));
            }
            else if (unknownColumn.test(errString)) {
                yield autoAlter(db, parseSQL(low));
            }
            return yield db.query(sql, sqlValues);
        });
        db.safeFree = (a, b) => safeFree(db, a, b);
        db.safeQuery = (a, b) => safeQuery(db, a, b);
        db.safeOnceQuery = (a, b) => safeOnceQuery(db, a, b);
        db.table = table;
        db.columns = columns;
        return db;
    };

    return freeSQL;

}));
