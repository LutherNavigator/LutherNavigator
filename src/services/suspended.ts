/**
 * Services for the suspended table.
 * @packageDocumentation
 */

import { BaseService, getTime, newUniqueID, pruneSuspension } from "./util";
import { User } from "./user";

/**
 * Suspended architecture.
 */
export interface Suspended {
  id: string;
  userID: string;
  suspendedUntil: number;
  createTime: number;
}

/**
 * Suspended services.
 */
export class SuspendedService extends BaseService {
  /**
   * Suspend a user's account.
   *
   * @param userID A user's ID.
   * @param until The time at which the account will no longer be suspended.
   * @param prune Whether or not to prune the suspension when the time comes.
   * @return The new suspension record's ID.
   */
  public async suspendUser(
    userID: string,
    until: number,
    prune: boolean = true
  ): Promise<string> {
    const suspensionID = await newUniqueID(this.dbm, "UserStatusChange");

    let sql = `SELECT id FROM Suspended WHERE userID = ?;`;
    let params: any[] = [userID];
    const rows: Suspended[] = await this.dbm.execute(sql, params);

    if (rows.length === 0) {
      sql = `
        INSERT INTO Suspended (
          id, userID, suspendedUntil, createTime
        ) VALUES (
          ?, ?, ?, ?
        );
      `;
      params = [suspensionID, userID, until, getTime()];
      await this.dbm.execute(sql, params);

      await this.dbm.sessionService.deleteUserSessions(userID);

      if (prune) {
        pruneSuspension(this.dbm, suspensionID);
      }

      return suspensionID;
    } else {
      return null;
    }
  }

  /**
   * Check if a suspension record exists.
   *
   * @param suspensionID A suspension record's ID.
   * @returns Whether or not the suuspension record exists.
   */
  public async suspensionExists(suspensionID: string): Promise<boolean> {
    const sql = `SELECT id FROM Suspended WHERE id = ?;`;
    const params = [suspensionID];
    const rows: Suspended[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a suspension record.
   *
   * @param suspensionID A suspension record's ID.
   * @returns The suspension record.
   */
  public async getSuspension(suspensionID: string): Promise<Suspended> {
    const sql = `SELECT * FROM Suspended WHERE id = ?;`;
    const params = [suspensionID];
    const rows: Suspended[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a suspension record.
   *
   * @param suspensionID A suspension record's ID.
   */
  public async deleteSuspension(suspensionID: string): Promise<void> {
    const sql = `DELETE FROM Suspended WHERE id = ?;`;
    const params = [suspensionID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Check whether or not a user's account has been suspended.
   *
   * @param userID A user's ID.
   * @returns Whether or not the user's account has been suspended.
   */
  public async userIsSuspended(userID: string): Promise<boolean> {
    const sql = `SELECT id FROM Suspended WHERE userID = ?;`;
    const params = [userID];
    const rows: Suspended[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get all suspended users.
   *
   * @returns All suspended users
   */
  public async suspendedUsers(): Promise<User[]> {
    const sql = `
      SELECT
          User.*, UserStatus.name AS status, Suspended.id AS suspensionID,
          suspendedUntil
        FROM User
        JOIN Suspended  ON User.id = Suspended.userID
        JOIN UserStatus ON User.statusID = UserStatus.id
      ORDER BY Suspended.suspendedUntil;
    `;
    const rows: User[] = await this.dbm.execute(sql);

    return rows;
  }
}
