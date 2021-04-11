/**
 * Services for admin functions.
 * @packageDocumentation
 */

import { BaseService } from "./util";

/**
 * Admin record count architecture.
 */
interface AdminRecordCount {
  count: number;
}

/**
 * Admin user architecture.
 */
export interface AdminUser {
  userID: string;
  firstname: string;
  lastname: string;
  email: string;
  status: string;
  verified: boolean;
  approved: boolean;
  admin: boolean;
  joinTime: number;
}

/**
 * Admin post architecture.
 */
export interface AdminPost {
  postID: string;
  location: string;
  postUser: string;
  program: string;
  rating: number;
  approved: boolean;
  createTime: number;
  adminFavorite: string | null;
}

/**
 * Admin services.
 */
export class AdminService extends BaseService {
  /**
   * Get the number of records in a table.
   *
   * @param table The table name.
   * @returns The number of records in the table.
   */
  public async getRecords(table: string): Promise<number> {
    const sql = `SELECT COUNT(*) AS count FROM ${table}`;
    const rows: AdminRecordCount[] = await this.dbm.execute(sql);
    return rows[0].count;
  }

  /**
   * Get all users.
   *
   * @returns All users in the database.
   */
  public async getUsers(): Promise<AdminUser[]> {
    const sql = `
      SELECT
          User.id AS userID, firstname, lastname, email,
          UserStatus.name AS status, verified, approved, admin, joinTime
        FROM User
        JOIN UserStatus ON User.statusID = UserStatus.id
      ORDER BY User.joinTime;
    `;
    const rows: AdminUser[] = await this.dbm.execute(sql);

    return rows;
  }

  /**
   * Get all posts.
   *
   * @returns All posts in the database.
   */
  public async getPosts(): Promise<AdminPost[]> {
    const sql = `
      SELECT
          Post.id AS postID, location,
          CONCAT(User.firstname, ' ', User.lastname) AS postUser,
          Program.name AS program, Rating.general AS rating,
          Post.approved AS approved, Post.createTime AS createTime,
          AdminFavorites.id AS adminFavorite
        FROM Post
             JOIN User           ON Post.userID = User.id
             JOIN Program        ON Post.programID = Program.id
             JOIN Rating         ON Post.ratingID = Rating.id
        LEFT JOIN AdminFavorites ON Post.id = AdminFavorites.postID
      ORDER BY Post.createTime;
    `;
    const rows: AdminPost[] = await this.dbm.execute(sql);

    return rows;
  }
}
