/**
 * Services for the password reset table.
 * @packageDocumentation
 */

import {
  BaseService,
  getTime,
  newUniqueID,
  prunePasswordResetRecord,
  passwordResetIDLength,
} from "./util";

/**
 * Password reset architecture.
 */
export interface PasswordReset {
  id: string;
  email: string;
  createTime: number;
}

/**
 * Password reset with only ID architecture.
 */
interface PasswordResetID {
  id: string;
}

/**
 * Password reset services.
 */
export class PasswordResetService extends BaseService {
  /**
   * Request a password reset.
   *
   * @param email The email address associated with the user's account.
   * @param prune Whether or not to prune the record when the time comes.
   * @returns The new password reset record's ID.
   */
  public async requestPasswordReset(
    email: string,
    prune: boolean = true
  ): Promise<string> {
    // Confirm that the email address exists
    const emailUnused = await this.dbm.userService.uniqueEmail(email);

    if (emailUnused) {
      return null;
    }

    // Confirm account is verified
    const user = await this.dbm.userService.getUserByEmail(email);
    const verified = await this.dbm.userService.isVerified(user.id);

    if (!verified) {
      return null;
    }

    // Check that no password reset has already been requested
    let sql = `SELECT id FROM PasswordReset WHERE email = ?;`;
    let params: any[] = [email];
    let rows: PasswordResetID[] = await this.dbm.execute(sql, params);

    if (rows.length > 0) {
      return null;
    }

    // Create the password reset record
    const newPasswordResetID = await newUniqueID(
      this.dbm,
      "PasswordReset",
      passwordResetIDLength
    );

    sql = `
      INSERT INTO PasswordReset (
        id, email, createTime
      ) VALUES (
        ?, ?, ?
      );
    `;
    params = [newPasswordResetID, email, getTime()];
    await this.dbm.execute(sql, params);

    if (prune) {
      prunePasswordResetRecord(this.dbm, newPasswordResetID);
    }

    return newPasswordResetID;
  }

  /**
   * Check if a password reset record exists.
   *
   * @param resetID A password reset record's ID.
   * @returns Whether or not the password reset record exists.
   */
  public async resetRecordExists(resetID: string): Promise<boolean> {
    const sql = `SELECT id FROM PasswordReset WHERE id = ?;`;
    const params = [resetID];
    const rows: PasswordResetID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a password reset record.
   *
   * @param resetID A password reset record's ID.
   * @returns The password reset record.
   */
  public async getResetRecord(resetID: string): Promise<PasswordReset> {
    const sql = `SELECT * FROM PasswordReset WHERE id = ?;`;
    const params = [resetID];
    const rows: PasswordReset[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a password reset record.
   *
   * @param resetID A password reset record's ID.
   */
  public async deleteResetRecord(resetID: string): Promise<void> {
    const sql = `DELETE FROM PasswordReset WHERE id = ?;`;
    const params = [resetID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Reset a user's password.
   *
   * @param resetID A password reset record's ID.
   * @param newPassword The user's new password.
   * @returns Whether or not the reset was successful.
   */
  public async resetPassword(
    resetID: string,
    newPassword: string
  ): Promise<boolean> {
    const resetRecord = await this.getResetRecord(resetID);

    if (!resetRecord) {
      return false;
    }

    const user = await this.dbm.userService.getUserByEmail(resetRecord.email);

    if (!user) {
      return false;
    }

    await this.dbm.userService.setUserPassword(user.id, newPassword);
    await this.deleteResetRecord(resetID);

    return true;
  }
}
