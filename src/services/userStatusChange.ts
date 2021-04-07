/**
 * Services for the user status change table.
 * @packageDocumentation
 */

import { BaseService, getTime, newUniqueID } from "./util";

/**
 * User status change architecture.
 */
export interface UserStatusChange {
  id: string;
  userID: string;
  newStatusID: number;
  createTime: number;
}

/**
 * User statuus change with only ID architecture.
 */
interface UserStatusChangeID {
  id: string;
}

/**
 * User status change requests architecture.
 */
export interface UserStatusChangeRequest {
  userID: string;
  firstname: string;
  lastname: string;
  email: string;
  status: string;
  newStatus: string;
  requestID: string;
}

/**
 * User status change services.
 */
export class UserStatusChangeService extends BaseService {
  /**
   * Create a new user status change request.
   *
   * @param userID The user's ID.
   * @param newStatusID The requested new status ID.
   * @returns The new status change request's ID.
   */
  public async createStatusChangeRequest(
    userID: string,
    newStatusID: number
  ): Promise<string> {
    const requestID = await newUniqueID(this.dbm, "UserStatusChange");

    let sql = `SELECT id FROM UserStatusChange WHERE userID = ?;`;
    let params: any[] = [userID];
    const rows: UserStatusChangeID[] = await this.dbm.execute(sql, params);

    if (rows.length === 0) {
      sql = `
        INSERT INTO UserStatusChange (
          id, userID, newStatusID, createTime
        ) VALUES (
          ?, ?, ?, ?
        );
      `;
      params = [requestID, userID, newStatusID, getTime()];
      await this.dbm.execute(sql, params);

      return requestID;
    } else {
      sql = `UPDATE UserStatusChange SET newStatusID = ? WHERE userID = ?;`;
      params = [newStatusID, userID];
      await this.dbm.execute(sql, params);

      return rows[0].id;
    }
  }

  /**
   * Check if a user status change request exists.
   *
   * @param requestID A status change request's ID.
   * @returns Whether or not the user status change request exists.
   */
  public async statusChangeRequestExists(requestID: string): Promise<boolean> {
    const sql = `SELECT id FROM UserStatusChange WHERE id = ?;`;
    const params = [requestID];
    const rows: UserStatusChangeID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a user status change request by ID.
   *
   * @param requestID A status change request's ID.
   * @returns The user status change request.
   */
  public async getStatusChangeRequest(
    requestID: string
  ): Promise<UserStatusChange> {
    const sql = `SELECT * FROM UserStatusChange WHERE id = ?;`;
    const params = [requestID];
    const rows: UserStatusChange[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a user status change request.
   *
   * @param requestID A status change request's ID.
   */
  public async deleteStatusChangeRequest(requestID: string): Promise<void> {
    const sql = `DELETE FROM UserStatusChange WHERE id = ?;`;
    const params = [requestID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get all user status change requests.
   *
   * @returns All user status change requests.
   */
  public async getStatusChangeRequests(): Promise<UserStatusChange[]> {
    const sql = `SELECT * FROM UserStatusChange;`;
    const params = [];
    const rows: UserStatusChange[] = await this.dbm.execute(sql, params);

    return rows;
  }

  public async getUserRequests(): Promise<UserStatusChangeRequest[]> {
    const sql = `
      SELECT
        User.id AS userID, firstname, lastname, email,
        us1.name AS status, us2.name AS newStatus,
        UserStatusChange.id AS requestID
      FROM UserStatusChange
      JOIN User              ON UserStatusChange.userID = User.id
      JOIN UserStatus AS us1 ON User.statusID = us1.id
      JOIN UserStatus AS us2 ON UserStatusChange.newStatusID = us2.id
      ORDER BY UserStatusChange.createTime;
    `;
    const rows: UserStatusChangeRequest[] = await this.dbm.execute(sql);

    return rows;
  }

  /**
   * Approve a user status change request.
   *
   * @param requestID A status change request's ID.
   */
  public async approveStatusChangeRequest(requestID: string): Promise<void> {
    const request = await this.getStatusChangeRequest(requestID);

    if (request) {
      const sql = `UPDATE User SET statusID = ? WHERE id = ?;`;
      const params = [request.newStatusID, request.userID];
      await this.dbm.execute(sql, params);

      await this.deleteStatusChangeRequest(requestID);
    }
  }

  /**
   * Deny a user status change request.
   *
   * @param requestID A status change request's ID.
   */
  public async denyStatusChangeRequest(requestID: string): Promise<void> {
    await this.deleteStatusChangeRequest(requestID);
  }
}
