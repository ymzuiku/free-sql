# free-sql

document: [https://free-sql.writeflowy.com/](https://free-sql.writeflowy.com/)

> Use mysql2/promise

- 在编写原生SQL时，更优雅的创建、更新表和字段
- 暂时只支持 mysql

## Install

```
$ yarn add free-sql
```

## Use

```ts
import Mysql from 'mysql2/promise';
import freeSQL from 'free-sql'

// 创建 mysql 连机器或连接池
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "...",
  database: "..."
});

// 对 mysql 连接器进行处理
const db = freeSQL(pool);

async function start(){
  // 提前约定表结构
  db.table("dog", [
      db.columns.id,
      db.columns.update_at,
      db.columns.create_at,
      "name varchar(307) unique",
      "age int",
      "key index(name, age)",
    ]);

  
  // 使用默认的 db.query 语句，会提示错误，user 表不存在
  await db.query('INSERT INTO user (name, age) VALUES ("dog", 20)');
  // 使用扩展的 db.free 语句，会自动创建表或字段，并进行
  await db.free('INSERT INTO user (name, age) VALUES ("dog", 20)');
}

start();
```

## 和 ORM 定义类有什么区别？

1. free-sql 保持原始的 SQL 脚本，更适合喜欢编写原始 SQL 的开发者
2. ORM 种类繁多，遇到复杂情况，往往最后还是会回归到编写 SQL 语句