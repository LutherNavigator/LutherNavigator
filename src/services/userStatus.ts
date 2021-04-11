/**
 * Services for the user status table.
 * @packageDocumentation
 */

import { BaseService } from "./util";

/**
 * User status architecture.
 */
export interface UserStatus {
  id: number;
  name: string;
}

/**
 * User status with only ID architecture.
 */
interface UserStatusID {
  id: number;
}

/**
 * User status with only name architecture.
 */
interface UserStatusName {
  name: string;
}

/**
 * User status services.
 */
export class UserStatusService extends BaseService {
  /**
   * Get all user statuses.
   *
   * @returns A list of all user statuses.
   */
  public async getStatuses(): Promise<UserStatus[]> {
    const sql = `SELECT * FROM UserStatus ORDER BY id;`;
    const rows: UserStatus[] = await this.dbm.execute(sql);

    return rows;
  }

  /**
   * Get the name of a user status by ID.
   *
   * @param statusID A status's ID.
   * @returns The status's name.
   */
  public async getStatusName(statusID: number): Promise<string> {
    const sql = `SELECT name FROM UserStatus WHERE id = ?;`;
    const params = [statusID];
    const rows: UserStatusName[] = await this.dbm.execute(sql, params);

    return rows[0]?.name;
  }

  /**
   * Check if a user status is valid.
   *
   * @param statusID A status's ID.
   * @returns Whether or not the status is valid.
   */
  public async validStatus(statusID: number): Promise<boolean> {
    const sql = `SELECT id FROM UserStatus WHERE id = ?;`;
    const params = [statusID];
    const rows: UserStatusID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }
}
