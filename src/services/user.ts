/**
 * Services for the user table.
 * @packageDocumentation
 */

import {
  BaseService,
  getTime,
  newUniqueID,
  hashPassword,
  checkPassword,
} from "./util";
import { Image } from "./image";

/**
 * User architecture.
 */
export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  statusID: number;
  verified: boolean;
  approved: boolean;
  admin: boolean;
  imageID: string | null;
  joinTime: number;
  lastLoginTime: number | null;
  lastPostTime: number | null;
}

/**
 * User services.
 */
export class UserService extends BaseService {
  /**
   * Create a user.
   *
   * @param firstname The user's first name.
   * @param lastname The user's last name.
   * @param email The user's email address.
   * @param password The user's password.
   * @param statusID The status ID of the user.
   * @returns The new user's ID.
   */
  public async createUser(
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    statusID: number
  ): Promise<string> {
    const userID = await newUniqueID(this.dbm, "User");
    const hashedPassword = await hashPassword(this.dbm, password);

    const sql = `
      INSERT INTO User (
        id, firstname, lastname, email, password, statusID, joinTime
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?
      );
    `;
    const params = [
      userID,
      firstname,
      lastname,
      email,
      hashedPassword,
      statusID,
      getTime(),
    ];
    await this.dbm.execute(sql, params);

    return userID;
  }

  /**
   * Check if a user exists.
   *
   * @param userID A user's ID.
   * @returns Whether or not the user exists.
   */
  public async userExists(userID: string): Promise<boolean> {
    const sql = `SELECT id FROM User WHERE id = ?;`;
    const params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a user.
   *
   * @param userID A user's ID.
   * @returns The user.
   */
  public async getUser(userID: string): Promise<User> {
    const sql = `SELECT * FROM User WHERE id = ?;`;
    const params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a user.
   *
   * @param userID A user's ID.
   */
  public async deleteUser(userID: string): Promise<void> {
    await this.deleteUserImage(userID);

    const sql = `DELETE FROM User WHERE id = ?;`;
    const params = [userID];
    await this.dbm.execute(sql, params);

    await this.dbm.sessionService.deleteUserSessions(userID);
    await this.dbm.postService.deleteUserPosts(userID);
  }

  /**
   * Get a user by their email address.
   *
   * @param email An email address.
   * @returns The user.
   */
  public async getUserByEmail(email: string): Promise<User> {
    const sql = `SELECT * FROM User WHERE email = ?;`;
    const params = [email];
    const rows: User[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Make sure an email address is not yet in use.
   *
   * @param email An email address.
   * @returns Whether or not the email address is unique.
   */
  public async uniqueEmail(email: string): Promise<boolean> {
    const sql = `SELECT email FROM User WHERE email = ?;`;
    const params = [email];
    const rows: User[] = await this.dbm.execute(sql, params);

    return rows.length === 0;
  }

  /**
   * Log a user in.
   *
   * @param email The user's email address.
   * @param password The user's password.
   * @returns Whether or not the login was successful.
   */
  public async login(email: string, password: string): Promise<boolean> {
    let sql = `SELECT password FROM User WHERE email = ? AND verified = TRUE AND approved = TRUE;`;
    let params: any[] = [email];
    let rows: User[] = await this.dbm.execute(sql, params);

    const hash = rows[0]?.password || "";
    const same = await checkPassword(password, hash);
    if (rows.length === 0 || !same) {
      return false;
    }

    sql = `UPDATE User SET lastLoginTime = ? WHERE email = ?;`;
    params = [getTime(), email];
    await this.dbm.execute(sql, params);

    return true;
  }

  /**
   * Get the name of a user's status.
   *
   * @param userID A user's ID.
   * @returns The name of the user's status.
   */
  public async getUserStatusName(userID: string): Promise<string> {
    const sql = `SELECT statusID FROM User WHERE id = ?;`;
    const params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    const statusID = rows[0]?.statusID;
    const statusName = await this.dbm.userStatusService.getStatusName(statusID);

    return statusName;
  }

  /**
   * Check if a user is verified.
   *
   * @param userID A user's ID.
   * @returns Whether or not the user's account has been verified.
   */
  public async isVerified(userID: string): Promise<boolean> {
    const sql = `SELECT verified FROM User WHERE id = ?;`;
    const params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    return !!rows[0]?.verified;
  }

  /**
   * Set a user's verification status.
   *
   * @param userID A user's ID.
   * @param verified Verification status.
   */
  public async setVerified(
    userID: string,
    verified: boolean = true
  ): Promise<void> {
    const sql = `UPDATE User SET verified = ? WHERE id = ?;`;
    const params = [verified, userID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Check if a user's account has been approved.
   *
   * @param userID A user's ID.
   * @return Whether or not the user's account has been approved.
   */
  public async isApproved(userID: string): Promise<boolean> {
    const sql = `SELECT approved FROM User WHERE id = ?;`;
    const params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    return !!rows[0]?.approved;
  }

  /**
   * Set a user's approved status.
   *
   * @param userID A user's ID.
   * @param approved Approved status.
   */
  public async setApproved(
    userID: string,
    approved: boolean = true
  ): Promise<void> {
    const sql = `UPDATE User SET approved = ? WHERE id = ?;`;
    const params = [approved, userID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get all unapproved users.
   *
   * @returns All unapproved users.
   */
  public async getUnapproved(): Promise<User[]> {
    const sql = `
      SELECT
        User.id AS userID, firstname, lastname, email, name AS status, joinTime
      FROM User JOIN UserStatus
      ON User.statusID = UserStatus.id
      WHERE approved = FALSE
      ORDER BY joinTime;
    `;
    const rows: User[] = await this.dbm.execute(sql);

    return rows;
  }

  /**
   * Check if a user is an admin.
   *
   * @param userID A user's ID.
   * @returns Whether or not the user is an admin.
   */
  public async isAdmin(userID: string): Promise<boolean> {
    const sql = `SELECT admin FROM User WHERE id = ?;`;
    const params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    return !!rows[0]?.admin;
  }

  /**
   * Set a user's admin status.
   *
   * @param userID A user's ID.
   * @param admin Admin status.
   */
  public async setAdmin(userID: string, admin: boolean = true): Promise<void> {
    const sql = `UPDATE User SET admin = ? WHERE id = ?;`;
    const params = [admin, userID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get a user's image.
   *
   * @param userID A user's ID.
   * @returns The user's profile image.
   */
  public async getUserImage(userID: string): Promise<Image> {
    const sql = `SELECT imageID from User WHERE id = ?;`;
    const params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    const imageID = rows[0]?.imageID;
    const image = await this.dbm.imageService.getImage(imageID);

    return image;
  }

  /**
   * Set a user's image.
   *
   * @param userID A user's ID.
   * @param imageData The new binary image data.
   */
  public async setUserImage(userID: string, imageData: Buffer): Promise<void> {
    let sql = `SELECT imageID from User WHERE id = ?;`;
    let params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    const newImageID = await this.dbm.imageService.createImage(imageData);

    sql = `UPDATE User SET imageID = ? WHERE id = ?`;
    params = [newImageID, userID];
    await this.dbm.execute(sql, params);

    const imageID = rows[0]?.imageID;
    await this.dbm.imageService.deleteImage(imageID);
  }

  /**
   * Delete a user's image.
   *
   * @param userID A user's ID.
   */
  public async deleteUserImage(userID: string): Promise<void> {
    let sql = `SELECT imageID from User WHERE id = ?;`;
    let params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    sql = `UPDATE User SET imageID = ? WHERE id = ?`;
    params = [null, userID];
    await this.dbm.execute(sql, params);

    const imageID = rows[0]?.imageID;
    await this.dbm.imageService.deleteImage(imageID);
  }

  /**
   * Set a user's password.
   *
   * @param userID A user's ID.
   * @param password The user's new password.
   */
  public async setUserPassword(
    userID: string,
    password: string
  ): Promise<void> {
    const hashedPassword = await hashPassword(this.dbm, password);

    const sql = `UPDATE User SET password = ? WHERE id = ?;`;
    const params = [hashedPassword, userID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Update a user's last post timestamp.
   *
   * @param userID A user's ID.
   */
  public async updateLastPostTime(userID: string): Promise<void> {
    const sql = `UPDATE User SET lastPostTime = ? WHERE id = ?;`;
    const params = [getTime(), userID];
    await this.dbm.execute(sql, params);
  }
}
