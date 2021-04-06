/**
 * Services for the post vote table.
 * @packageDocumentation
 */

import { BaseService, getTime } from "./util";
import { User } from "./user";
import { Post } from "./post";

/**
 * Post vote architecture.
 */
export interface PostVote {
  id: number;
  userID: string;
  postID: string;
  voteType: string;
  createTime: number;
}

/**
 * Post vote services
 */
export class PostVoteService extends BaseService {
  /**
   * Vote on a post.
   *
   * @param userID A user's ID.
   * @param postID A post's ID.
   * @param voteType The type of vote.
   */
  public async vote(
    userID: string,
    postID: string,
    voteType: string
  ): Promise<void> {
    this.unvote(userID, postID);

    const sql = `
      INSERT INTO PostVote (
        userID, postID, voteType, createTime
      ) VALUES (
        ?, ?, ?, ?
      );
    `;
    const params = [userID, postID, voteType, getTime()];
    await this.dbm.execute(sql, params);
  }

  /**
   * Unvote a post.
   *
   * @param userID A user's ID.
   * @param postID A post's ID.
   */
  public async unvote(userID: string, postID: string): Promise<void> {
    const sql = `DELETE FROM PostVote WHERE userID = ? AND postID = ?;`;
    const params = [userID, postID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Check if a post has been voted on by a user.
   *
   * @param userID A user's ID.
   * @param postID A post's ID.
   * @returns Whether or not the post has been voted on by a user.
   */
  public async voted(userID: string, postID: string): Promise<boolean> {
    const sql = `SELECT id FROM PostVote WHERE userID = ? AND postID = ?;`;
    const params = [userID, postID];
    const rows: PostVote[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a post vote record.
   *
   * @param userID A user's ID.
   * @param postID A post's ID.
   * @returns The post vote record.
   */
  public async getVote(userID: string, postID: string): Promise<PostVote> {
    const sql = `SELECT * FROM PostVote WHERE userID = ? AND postID = ?;`;
    const params = [userID, postID];
    const rows: PostVote[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Get all post vote records.
   *
   * @returns All post vote records.
   */
  public async getVotes(): Promise<PostVote[]> {
    const sql = `SELECT * FROM PostVote;`;
    const rows: PostVote[] = await this.dbm.execute(sql);

    return rows;
  }

  /**
   * Get all of a user's post votes.
   *
   * @param userID A user's ID.
   * @returns All of a user's votes.
   */
  public async getUserVotes(userID: string): Promise<PostVote[]> {
    const sql = `SELECT * FROM PostVote WHERE userID = ?;`;
    const params = [userID];
    const rows: PostVote[] = await this.dbm.execute(sql, params);

    return rows;
  }

  /**
   * Get all of the votes on a post.
   *
   * @param postID A post's ID.
   * @returns All of the votes on a post.
   */
  public async getPostVotes(postID: string): Promise<PostVote[]> {
    const sql = `SELECT * FROM PostVote WHERE postID = ?;`;
    const params = [postID];
    const rows: PostVote[] = await this.dbm.execute(sql, params);

    return rows;
  }

  /**
   * Delete all of a user's votes.
   *
   * @param userID A user's ID.
   */
  public async deleteUserVotes(userID: string): Promise<void> {
    const sql = `DELETE FROM PostVote WHERE userID = ?;`;
    const params = [userID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Delete all of a post's votes.
   *
   * @param postID A post's ID.
   */
  public async deletePostVotes(postID: string): Promise<void> {
    const sql = `DELETE FROM PostVote WHERE postID = ?;`;
    const params = [postID];
    await this.dbm.execute(sql, params);
  }
}
