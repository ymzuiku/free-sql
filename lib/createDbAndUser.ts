export async function deleteUser(connector: any, user: string, host: string) {
  const [
    old,
  ]: any = await connector.query(
    "select user from mysql.user where user=? and host=?",
    [user, host]
  );

  if (old[0]) {
    try {
      await connector.query(`drop user '${user}'@'${host}'`);
      // await db.query(sql`drop user #${user}@'%'`);
    } catch (err) {
      if (err.toString().indexOf("Operation DROP USER") === -1) {
        console.error(err);
      }
    }
  }
}

export interface CreateDbAndUserOpt {
  host: string;
  dbName: string;
  user: string;
  password: string;
}

const userReg = /^[.a-zA-Z0-9_-]{4,40}$/;
const hostReg = /^[%.a-zA-Z0-9_-]{1,40}$/;
const passwordReg = /^.{8,40}$/;

export async function createDbAndUser(
  connector: any,
  { host, dbName, user, password }: CreateDbAndUserOpt
) {
  if (!userReg.test(user)) {
    throw "user name is error";
  }
  if (!hostReg.test(host)) {
    throw "host is error";
  }
  if (!passwordReg.test(password)) {
    throw "password is error";
  }
  await deleteUser(connector, user, host);
  try {
    await connector.query(`create database ${dbName}`);
  } catch (err) {
    // if (err.toString().indexOf("database exists") === -1) {
    //   console.error(err);
    // }
  }

  await connector.query(`create user '${user}'@'${host}' IDENTIFIED BY ?`, [
    password,
  ]);
  // await connector.query(`REVOKE all privileges on *.* to '${user}'@'${host}'`);
  await connector.query(`flush privileges`);
  await connector.query(
    `grant all privileges on ${dbName}.* to '${user}'@'${host}'`
  );
  await connector.query(`flush privileges`);
}
