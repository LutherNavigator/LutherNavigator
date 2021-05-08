/**
 * Services for the email change table.
 * @packageDocumentation
 */

import {
  BaseService,
  getTime,
  newUniqueID,
  pruneEmailChangeRecord,
  emailChangeIDLength,
} from "./util";

/**
 * Email change architecture.
 */
export interface EmailChange {
  id: string;
  userID: string;
  newEmail: string;
  createTime: number;
}

/**
 * Email change with only ID architecture.
 */
interface EmailChangeID {
  id: string;
}

/**
 * Email changing services.
 */
export class EmailChangeService extends BaseService {
  /**
   * Create an email change record.
   *
   * @param userID The user's ID.
   * @param newEmail The new email address.
   * @param prune Whether or not to prune the record when the time comes.
   * @returns The new email change record's ID.
   */
  public async createEmailChangeRecord(
    userID: string,
    newEmail: string,
    prune: boolean = true
  ): Promise<string> {
    // Confirm that the email address does not exist
    const emailUnused = await this.dbm.userService.uniqueEmail(newEmail);

    if (!emailUnused) {
      return null;
    }

    // Check that no email change record has already been created
    const recordExists = await this.emailChangeRecordExistsByUserID(userID);

    if (recordExists) {
      const emailChangeID = await this.editEmailChangeRecord(userID, newEmail);

      return emailChangeID;
    } else {
      // Create the email change record
      const newEmailChangeID = await newUniqueID(
        this.dbm,
        "EmailChange",
        emailChangeIDLength
      );

      const sql = `
        INSERT INTO EmailChange (
          id, userID, newEmail, createTime
        ) VALUES (
          ?, ?, ?, ?
        );
      `;
      const params = [newEmailChangeID, userID, newEmail, getTime()];
      await this.dbm.execute(sql, params);

      if (prune) {
        pruneEmailChangeRecord(this.dbm, newEmailChangeID);
      }

      return newEmailChangeID;
    }
  }

  /**
   * Check if an email change record exists.
   *
   * @param emailChangeID An email change record's ID.
   * @returns Whether or not the email change record exists.
   */
  public async emailChangeRecordExists(
    emailChangeID: string
  ): Promise<boolean> {
    const sql = `SELECT id FROM EmailChange WHERE id = ?;`;
    const params = [emailChangeID];
    const rows: EmailChangeID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Check if an email change record exists for a given user.
   *
   * @param userID A user's ID.
   * @returns Whether or not the email change record exists.
   */
  public async emailChangeRecordExistsByUserID(
    userID: string
  ): Promise<boolean> {
    const sql = `SELECT id FROM EmailChange WHERE userID = ?;`;
    const params = [userID];
    const rows: EmailChangeID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get an email change record.
   *
   * @param emailChangeID An email change record's ID.
   * @returns The email change record.
   */
  public async getEmailChangeRecord(
    emailChangeID: string
  ): Promise<EmailChange> {
    const sql = `SELECT * FROM EmailChange WHERE id = ?;`;
    const params = [emailChangeID];
    const rows: EmailChange[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Get an email change record for a given user.
   *
   * @param emailChangeID An email change record's ID.
   * @returns The email change record.
   */
  public async getEmailChangeRecordByUserID(
    userID: string
  ): Promise<EmailChange> {
    const sql = `SELECT * FROM EmailChange WHERE userID = ?;`;
    const params = [userID];
    const rows: EmailChange[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Edit an email change record.
   *
   * @param userID A user's ID.
   * @param newEmail The new email address.
   * @returns The existing email change record's ID.
   */
  public async editEmailChangeRecord(
    userID: string,
    newEmail: string
  ): Promise<string> {
    const emailChangeRecord = await this.getEmailChangeRecordByUserID(userID);

    const sql = `UPDATE EmailChange SET newEmail = ? WHERE id = ?;`;
    const params = [newEmail, emailChangeRecord.id];
    await this.dbm.execute(sql, params);

    return emailChangeRecord.id;
  }

  /**
   * Delete an email change record.
   *
   * @param emailChangeID An email change record's ID.
   */
  public async deleteEmailChangeRecord(emailChangeID: string): Promise<void> {
    const sql = `DELETE FROM EmailChange WHERE id = ?;`;
    const params = [emailChangeID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Delete an email change record for a given user.
   *
   * @param userID A user's ID.
   */
  public async deleteEmailChangeRecordByUserID(userID: string): Promise<void> {
    const sql = `DELETE FROM EmailChange WHERE userID = ?;`;
    const params = [userID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Change a user's email address.
   *
   * @param emailChangeID An email change record's ID.
   * @returns Whether or not the email change was successful.
   */
  public async changeEmail(emailChangeID: string): Promise<boolean> {
    const emailChangeRecord = await this.getEmailChangeRecord(emailChangeID);

    if (!emailChangeRecord) {
      return false;
    }

    const user = await this.dbm.userService.getUser(emailChangeRecord.userID);

    if (!user) {
      return false;
    }

    const sql = `UPDATE User SET email = ? WHERE id = ?;`;
    const params = [emailChangeRecord.newEmail, emailChangeRecord.userID];
    await this.dbm.execute(sql, params);

    await this.deleteEmailChangeRecord(emailChangeID);

    return true;
  }
}
