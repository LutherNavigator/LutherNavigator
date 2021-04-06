/**
 * Utilities for services.
 * @packageDocumentation
 */

import DatabaseManager from "../services";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { metaConfig } from "../config";

/**
 * Database connection URL.
 */
export const dbURL = process.env.DATABASE_URL;

/**
 * Standard length of an ID.
 */
export const idLength = 4;

/**
 * Length of a session ID.
 */
export const sessionIDLength = 16;

/**
 * Length of a verification ID.
 */
export const verifyIDLength = 16;

/**
 * Length of a password reset ID.
 */
export const passwordResetIDLength = 16;

/**
 * Table with a string ID field.
 */
interface TableStringID {
  id: string;
}

/**
 * Session with only update time architecture.
 */
interface SessionUpdateTime {
  updateTime: number;
}

/**
 * Session with only ID and update time architecture.
 */
interface SessionIDUpdateTime {
  id: string;
  updateTime: number;
}

/**
 * Verify with only ID and create time architecture.
 */
interface VerifyIDCreateTime {
  id: string;
  createTime: number;
}

/**
 * Password reset with only ID and create time architecture.
 */
interface PasswordResetIDCreateTime {
  id: string;
  createTime: number;
}

/**
 * Suspended with only ID architecture.
 */
interface SuspendedID {
  id: string;
}

/**
 * Base service class.
 */
export abstract class BaseService {
  readonly dbm: DatabaseManager;

  constructor(dbm: DatabaseManager) {
    this.dbm = dbm;
  }
}

/**
 * Get the current timestamp.
 *
 * @returns The timestamp in seconds.
 */
export function getTime(): number {
  return Math.floor(new Date().getTime() / 1000);
}

/**
 * Set a timeout without the 32-bit limit.
 *
 * @param callback The callback.
 * @param ms Number of milliseconds before calling the callback.
 * @param args Arguments to pass to the callback.
 */
export function setBigTimeout(
  callback: (...args: any[]) => void,
  ms: number,
  ...args: any[]
) {
  if (ms < 2 ** 31) {
    setTimeout(callback, ms, ...args);
  } else {
    setTimeout(
      setBigTimeout,
      2 ** 31 - 1,
      callback,
      ms - (2 ** 31 - 1),
      ...args
    );
  }
}

/**
 * Generate a new ID.
 *
 * @param len The length of the ID.
 * @returns The new ID.
 */
export async function newID(len: number = idLength): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(len, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        let base64ID = buffer.toString("base64").slice(0, len);
        while (base64ID.includes("/")) base64ID = base64ID.replace("/", "-");
        while (base64ID.includes("+")) base64ID = base64ID.replace("+", "_");
        resolve(base64ID);
      }
    });
  });
}

/**
 * Generate a new unique ID for a table.
 *
 * @param dbm The database manager.
 * @param table The table name.
 * @param len The length of the ID.
 * @returns The new unique ID.
 */
export async function newUniqueID(
  dbm: DatabaseManager,
  table: string,
  len: number = idLength
): Promise<string> {
  let base64ID = await newID(len);

  const sql = `SELECT id FROM ${table} WHERE id = ?;`;
  let rows: TableStringID[] = await dbm.execute(sql, [base64ID]);

  while (rows.length > 0) {
    base64ID = await newID(len);
    rows = await dbm.execute(sql, [base64ID]);
  }

  return base64ID;
}

/**
 * Hash a password asynchronously.
 *
 * @param password The password.
 * @param rounds The number of salt rounds for bcrypt to use.
 * @returns The hashed password.
 */
export async function hashPasswordAsync(
  password: string,
  rounds: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, rounds, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

/**
 * Hash a password.
 *
 * @param dbm The database manager.
 * @param password The password.
 * @param rounds The number of salt rounds for bcrypt to use.
 * @returns The hashed password.
 */
export async function hashPassword(
  dbm: DatabaseManager,
  password: string,
  rounds: number = null
): Promise<string> {
  if (!rounds) {
    rounds =
      parseInt(await dbm.metaService.get("Salt rounds")) ||
      metaConfig["Salt rounds"];
  }

  return await hashPasswordAsync(password, rounds);
}

/**
 * Check if passwords match.
 *
 * @param password The password.
 * @param hash The hashed password.
 * @returns Whether or not the password and hash match.
 */
export async function checkPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, same) => {
      if (err) {
        reject(err);
      } else {
        resolve(same);
      }
    });
  });
}

/**
 * Delete a session when the time comes.
 *
 * @param dbm The database manager.
 * @param sessionID A session's ID.
 * @param timeRemaining The amount of time to wait before removing the session.
 */
export async function pruneSession(
  dbm: DatabaseManager,
  sessionID: string,
  timeRemaining: number = null
): Promise<void> {
  const sessionAge =
    (parseInt(await dbm.metaService.get("Session age")) ||
      metaConfig["Session age"]) * 1000;
  if (timeRemaining === null) {
    timeRemaining = sessionAge;
  }

  setTimeout(async () => {
    let sql = `SELECT updateTime FROM Session WHERE id = ?;`;
    let params = [sessionID];
    const rows: SessionUpdateTime[] = await dbm.execute(sql, params);

    const updateTime = rows[0]?.updateTime;
    const deleteTime = updateTime + sessionAge / 1000;

    if (deleteTime && getTime() - deleteTime >= 0) {
      sql = `DELETE FROM Session WHERE id = ?;`;
      params = [sessionID];
      await dbm.execute(sql, params);
    }
  }, timeRemaining);
}

/**
 * Delete all active sessions when the time comes.
 *
 * @param dbm The database manager.
 */
export async function pruneSessions(dbm: DatabaseManager): Promise<void> {
  const sql = `SELECT id, updateTime FROM Session;`;
  const params = [];
  const rows: SessionIDUpdateTime[] = await dbm.execute(sql, params);

  const sessionAge =
    (parseInt(await dbm.metaService.get("Session age")) ||
      metaConfig["Session age"]) * 1000;

  rows.forEach((row) => {
    const timeRemaining = row.updateTime + sessionAge / 1000 - getTime();
    pruneSession(dbm, row.id, timeRemaining * 1000);
  });
}

/**
 * Delete a verification record when the time comes.
 *
 * @param dbm The database manager.
 * @param verifyID A verification ID.
 * @param timeRemaining The amount of time to wait before removing the record.
 */
export async function pruneVerifyRecord(
  dbm: DatabaseManager,
  verifyID: string,
  timeRemaining: number = null
): Promise<void> {
  const verifyAge =
    (parseInt(await dbm.metaService.get("Verify age")) ||
      metaConfig["Verify age"]) * 1000;
  if (timeRemaining === null) {
    timeRemaining = verifyAge;
  }

  setTimeout(async () => {
    await dbm.verifyService.deleteUnverifiedUser(verifyID);
  }, timeRemaining);
}

/**
 * Delete all active verification records when the time comes.
 *
 * @param dbm The database manager.
 */
export async function pruneVerifyRecords(dbm: DatabaseManager): Promise<void> {
  const sql = `SELECT id, createTime FROM Verify;`;
  const params = [];
  const rows: VerifyIDCreateTime[] = await dbm.execute(sql, params);

  const verifyAge =
    (parseInt(await dbm.metaService.get("Verify age")) ||
      metaConfig["Verify age"]) * 1000;

  rows.forEach((row) => {
    const timeRemaining = row.createTime + verifyAge / 1000 - getTime();
    pruneVerifyRecord(dbm, row.id, timeRemaining * 1000);
  });
}

/**
 * Delete a password reset record when the time comes.
 *
 * @param dbm The database manager.
 * @param resetID A password reset ID.
 * @param timeRemaining The amount of time to wait before removing the record.
 */
export async function prunePasswordResetRecord(
  dbm: DatabaseManager,
  resetID: string,
  timeRemaining: number = null
): Promise<void> {
  const passwordResetAge =
    (parseInt(await dbm.metaService.get("Password reset age")) ||
      metaConfig["Password reset age"]) * 1000;
  if (timeRemaining === null) {
    timeRemaining = passwordResetAge;
  }

  setTimeout(async () => {
    await dbm.passwordResetService.deleteResetRecord(resetID);
  }, timeRemaining);
}

/**
 * Delete all active password reset records when the time comes.
 *
 * @param dbm The database manager.
 */
export async function prunePasswordResetRecords(
  dbm: DatabaseManager
): Promise<void> {
  const sql = `SELECT id, createTime FROM PasswordReset;`;
  const params = [];
  const rows: PasswordResetIDCreateTime[] = await dbm.execute(sql, params);

  const passwordResetAge =
    (parseInt(await dbm.metaService.get("Password reset age")) ||
      metaConfig["Password reset age"]) * 1000;

  rows.forEach((row) => {
    const timeRemaining = row.createTime + passwordResetAge / 1000 - getTime();
    prunePasswordResetRecord(dbm, row.id, timeRemaining * 1000);
  });
}

/**
 * Delete a suspension record when the time comes.
 *
 * @param dbm The database manager.
 * @param suspensionID A suspension record ID.
 * @param timeRemaining The amount of time to wait before removing the record.
 */
export async function pruneSuspension(
  dbm: DatabaseManager,
  suspensionID: string,
  timeRemaining: number = null
): Promise<void> {
  const suspension = await dbm.suspendedService.getSuspension(suspensionID);

  if (timeRemaining === null) {
    timeRemaining = (suspension.suspendedUntil - getTime()) * 1000;
  }

  setBigTimeout(async () => {
    await dbm.suspendedService.deleteSuspension(suspensionID);
  }, timeRemaining);
}

/**
 * Delete all active suspension records when the time comes.
 *
 * @param dbm The database manager.
 */
export async function pruneSuspensions(dbm: DatabaseManager): Promise<void> {
  const sql = `SELECT id FROM Suspended;`;
  const rows: SuspendedID[] = await dbm.execute(sql);

  rows.forEach((row) => {
    pruneSession(dbm, row.id);
  });
}
