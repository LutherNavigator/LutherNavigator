import * as db from "../db";
import * as crypto from "crypto";

// Constants
export const dbURL = process.env.DATABASE_URL;
const idLength = 4;

// Database object
const mainDB = new db.DB(dbURL);
export default mainDB;

// Get the current timestamp
export function getTime(): number {
  return Math.floor(new Date().getTime() / 1000);
}

// Generate a new ID
export async function newID(): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(idLength, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        let base64ID = buffer.toString("base64").slice(0, idLength);
        while (base64ID.includes("/")) base64ID = base64ID.replace("/", "-");
        while (base64ID.includes("+")) base64ID = base64ID.replace("+", "_");
        resolve(base64ID);
      }
    });
  });
}

// Generate a new unique ID for a table
export async function newUniqueID(table: string): Promise<string> {
  let base64ID: string = await newID();

  const sql: string = `SELECT id FROM ${table} WHERE id = ?;`;
  let rows: any[] = await mainDB.execute(sql, [base64ID]);

  while (rows.length > 0) {
    base64ID = await newID();
    rows = await mainDB.execute(sql, [base64ID]);
  }

  return base64ID;
}
