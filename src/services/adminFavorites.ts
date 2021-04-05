/**
 * Services for the admin favorites table.
 * @packageDocumentation
 */

import { BaseService, getTime, newUniqueID } from "./util";
import { Post } from "./post";

/**
 * Admin favorites architecture.
 */
export interface AdminFavorites {
  id: string;
  postID: string;
  createTime: number;
}

/**
 * Admin favorites services.
 */
export class AdminFavoritesService extends BaseService {
  /**
   * Get an admin favorite record.
   *
   * @param favoriteID A favorite's ID.
   * @returns The admin favorite record.
   */
  public async getFavorite(favoriteID: string): Promise<AdminFavorites> {
    const sql = `SELECT * FROM AdminFavorites WHERE id = ?;`;
    const params = [favoriteID];
    const rows: AdminFavorites[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Get an admin favorite record by post ID.
   *
   * @param postID A post's ID.
   * @returns The admin favorite record.
   */
  public async getFavoriteByPostID(postID: string): Promise<AdminFavorites> {
    const sql = `SELECT * FROM AdminFavorites WHERE postID = ?;`;
    const params = [postID];
    const rows: AdminFavorites[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Favorite a post.
   *
   * @param postID A post's ID.
   * @returns The new favorite's ID.
   */
  public async favorite(postID: string): Promise<string> {
    const favorited = await this.isFavorite(postID);

    if (!favorited) {
      const favoriteID = await newUniqueID(this.dbm, "AdminFavorites");

      const sql = `
        INSERT INTO AdminFavorites (
          id, postID, createTime
        ) VALUES (
          ?, ?, ?
        );
      `;
      const params = [favoriteID, postID, getTime()];
      await this.dbm.execute(sql, params);

      return favoriteID;
    } else {
      return null;
    }
  }

  /**
   * Unfavorite a post.
   *
   * @param postID A post's ID.
   */
  public async unfavorite(postID: string): Promise<void> {
    const sql = `DELETE FROM AdminFavorites WHERE postID = ?;`;
    const params = [postID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Check if a post is an admin favorite.
   *
   * @param postID A post's ID.
   * @returns Whether or not the post is an admin favorite.
   */
  public async isFavorite(postID: string): Promise<boolean> {
    const sql = `SELECT id FROM AdminFavorites WHERE postID = ?;`;
    const params = [postID];
    const rows: AdminFavorites[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get all admin favorites.
   *
   * @returns All admin favorited items.
   */
  public async getFavorites(): Promise<AdminFavorites[]> {
    const sql = `SELECT * FROM AdminFavorites ORDER BY createTime`;
    const params = [];
    const rows: AdminFavorites[] = await this.dbm.execute(sql, params);

    return rows;
  }

  /**
   * Get all admin favorite posts.
   *
   * @returns All admin favorited posts.
   */
  public async getFavoritePosts(): Promise<Post[]> {
    const sql = `
      SELECT Post.*
        FROM Post
        JOIN AdminFavorites
          ON Post.id = AdminFavorites.postID
      ORDER BY AdminFavorites.createTime;
    `;
    const params = [];
    const rows: Post[] = await this.dbm.execute(sql, params);

    return rows;
  }

  /**
   * Get the n most recent favorited posts.
   *
   * @param num The number of favorited posts to return.
   * @returns Recently made favorited posts.
   */
  public async getRecentFavorites(num: number): Promise<Post[]> {
    const sql = `
      SELECT Post.*
        FROM Post
        JOIN AdminFavorites
          ON Post.id = AdminFavorites.postID
      ORDER BY Post.createTime DESC
      LIMIT ?;
    `;
    const params = [num];
    const rows: Post[] = await this.dbm.execute(sql, params);

    return rows;
  }
}
