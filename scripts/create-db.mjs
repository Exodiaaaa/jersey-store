import mysql from "mysql2/promise";

const databaseUrl = new URL(process.env.DATABASE_URL ?? "mysql://root:root@localhost:3306/kvn_footwear");
const databaseName = databaseUrl.pathname.replace("/", "") || "kvn_footwear";

const connection = await mysql.createConnection({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
});

await connection.query(
  `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await connection.end();

console.log(`Database ready: ${databaseName}`);
