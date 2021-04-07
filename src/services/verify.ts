/**
 * Services for the verify table.
 * @packageDocumentation
 */

import {
  BaseService,
  getTime,
  newUniqueID,
  pruneVerifyRecord,
  verifyIDLength,
} from "./util";

/**
 * Verify architecture.
 */
export interface Verify {
  id: string;
  email: string;
  createTime: number;
}

/**
 * Verify with only ID architecture.
 */
interface VerifyID {
  id: string;
}

/**
 * Verification services.
 */
export class VerifyService extends BaseService {
  /**
   * Create a user verification record.
   *
   * @param email The email address associated with the user's account.
   * @param prune Whether or not to prune the record when the time comes.
   * @returns The new verification record's ID.
   */
  public async createVerifyRecord(
    email: string,
    prune: boolean = true
  ): Promise<string> {
    // Confirm that the email address does not exist
    const emailUnused = await this.dbm.userService.uniqueEmail(email);

    if (!emailUnused) {
      return null;
    }

    // Check that no verification record has already been created
    let sql = `SELECT id FROM Verify WHERE email = ?;`;
    let params: any[] = [email];
    let rows: VerifyID[] = await this.dbm.execute(sql, params);

    if (rows.length > 0) {
      return null;
    }

    // Create the verification record
    const newVerifyID = await newUniqueID(this.dbm, "Verify", verifyIDLength);

    sql = `
      INSERT INTO Verify (
        id, email, createTime
      ) VALUES (
        ?, ?, ?
      );
    `;
    params = [newVerifyID, email, getTime()];
    await this.dbm.execute(sql, params);

    if (prune) {
      pruneVerifyRecord(this.dbm, newVerifyID);
    }

    return newVerifyID;
  }

  /**
   * Check if a verification record exists.
   *
   * @param verifyID A verification record's ID.
   * @returns Whether or not the verification record exists.
   */
  public async verifyRecordExists(verifyID: string): Promise<boolean> {
    const sql = `SELECT id FROM Verify WHERE id = ?;`;
    const params = [verifyID];
    const rows: VerifyID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a verification record.
   *
   * @param verifyID A verification record's ID.
   * @returns The verification record.
   */
  public async getVerifyRecord(verifyID: string): Promise<Verify> {
    const sql = `SELECT * FROM Verify WHERE id = ?;`;
    const params = [verifyID];
    const rows: Verify[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a verification record.
   *
   * @param verifyID A verification record's ID.
   */
  public async deleteVerifyRecord(verifyID: string): Promise<void> {
    const sql = `DELETE FROM Verify WHERE id = ?;`;
    const params = [verifyID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Delete a verification record and the corresponding user.
   *
   * @param verifyID A verification record's ID.
   */
  public async deleteUnverifiedUser(verifyID: string): Promise<void> {
    const verifyRecord = await this.getVerifyRecord(verifyID);

    if (verifyRecord) {
      const user = await this.dbm.userService.getUserByEmail(
        verifyRecord.email
      );

      if (user && !user.verified) {
        await this.dbm.userService.deleteUser(user.id);
      }

      await this.deleteVerifyRecord(verifyID);
    }
  }

  /**
   * Verify a user.
   *
   * @param verifyID A verification record's ID.
   * @returns Whether or not the verification was successful.
   */
  public async verifyUser(verifyID: string): Promise<boolean> {
    const verifyRecord = await this.getVerifyRecord(verifyID);

    if (!verifyRecord) {
      return false;
    }

    const user = await this.dbm.userService.getUserByEmail(verifyRecord.email);

    if (!user) {
      return false;
    }

    await this.dbm.userService.setVerified(user.id);
    await this.deleteVerifyRecord(verifyID);

    return true;
  }
}
