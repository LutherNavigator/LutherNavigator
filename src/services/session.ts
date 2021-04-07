/**
 * Services for the session table.
 * @packageDocumentation
 */

import {
  BaseService,
  getTime,
  newUniqueID,
  pruneSession,
  sessionIDLength,
} from "./util";
import { User } from "./user";

/**
 * Session architecture.
 */
export interface Session {
  id: string;
  userID: string;
  createTime: number;
  updateTime: number;
}

/**
 * Session with only ID architecture.
 */
interface SessionID {
  id: string;
}

/**
 * Session with only user ID architecture.
 */
interface SessionUserID {
  userID: string;
}

/**
 * Session services.
 */
export class SessionService extends BaseService {
  /**
   * Create a session.
   *
   * @param userID The ID of the user associated with the session.
   * @param prune Whether or not to prune the session when the time comes.
   * @returns The new session's ID.
   */
  public async createSession(
    userID: string,
    prune: boolean = true
  ): Promise<string> {
    const newSessionID = await newUniqueID(
      this.dbm,
      "Session",
      sessionIDLength
    );

    const sql = `
      INSERT INTO Session (
        id, userID, createTime, updateTime
      ) VALUES (
        ?, ?, ?, ?
      );
    `;
    const now = getTime();
    const params = [newSessionID, userID, now, now];
    await this.dbm.execute(sql, params);

    if (prune) {
      pruneSession(this.dbm, newSessionID);
    }

    return newSessionID;
  }

  /**
   * Check if a session exists.
   *
   * @param sessionID A session's ID.
   * @returns Whether or not the session exists.
   */
  public async sessionExists(sessionID: string): Promise<boolean> {
    const sql = `SELECT id FROM Session WHERE id = ?;`;
    const params = [sessionID];
    const rows: SessionID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a session.
   *
   * @param sessionID A session's ID.
   * @returns The session.
   */
  public async getSession(sessionID: string): Promise<Session> {
    const sql = `SELECT * FROM Session WHERE id = ?;`;
    const params = [sessionID];
    const rows: Session[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a session.
   *
   * @param sessionID A session's ID.
   */
  public async deleteSession(sessionID: string): Promise<void> {
    const sql = `DELETE FROM Session WHERE id = ?;`;
    const params = [sessionID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get all of a user's sessions.
   *
   * @param userID A user's ID.
   * @returns A list of all sessions associated with the user.
   */
  public async getUserSessions(userID: string): Promise<Session[]> {
    const sql = `SELECT * FROM Session WHERE userID = ? ORDER BY createTime;`;
    const params = [userID];
    const rows: Session[] = await this.dbm.execute(sql, params);

    return rows;
  }

  /**
   * Delete all of a user's sessions.
   *
   * @param userID A user's ID.
   */
  public async deleteUserSessions(userID: string): Promise<void> {
    const sql = `DELETE FROM Session WHERE userID = ?;`;
    const params = [userID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get a user ID by session ID.
   *
   * @param sessionID A session's ID.
   * @returns The ID of the user associated with the session.
   */
  public async getUserIDBySessionID(sessionID: string): Promise<string> {
    const sql = `SELECT userID from Session WHERE id = ?;`;
    const params = [sessionID];
    const rows: SessionUserID[] = await this.dbm.execute(sql, params);

    return rows[0]?.userID;
  }

  /**
   * Get a user by session ID.
   *
   * @param sessionID A session's ID.
   * @returns The user associated with the session.
   */
  public async getUserBySessionID(sessionID: string): Promise<User> {
    const userID = await this.getUserIDBySessionID(sessionID);

    const sql = `SELECT * FROM User WHERE id = ?;`;
    const params = [userID];
    const rows: User[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Update the timestamp at which the session ID was last used.
   *
   * @param sessionID A session's ID.
   */
  public async updateSession(
    sessionID: string,
    prune: boolean = true
  ): Promise<void> {
    const sql = `UPDATE Session SET updateTime = ? WHERE id = ?;`;
    const params = [getTime(), sessionID];
    await this.dbm.execute(sql, params);

    if (prune) {
      pruneSession(this.dbm, sessionID);
    }
  }
}
