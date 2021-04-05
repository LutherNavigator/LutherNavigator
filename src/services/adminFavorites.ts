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

  }

  /**
   * Favorite a post.
   *
   * @param postID A post's ID.
   * @returns The new favorite's ID.
   */
  public async favorite(postID: string): Promise<string> {

  }

  /**
   * Unfavorite a post.
   *
   * @param postID A post's ID.
   */
  public async unfavorite(postID: string): Promise<void> {

  }

  /**
   * Check if a post is an admin favorite.
   *
   * @param postID A post's ID.
   * @returns Whether or not the post is an admin favorite.
   */
  public async isFavorite(postID: string): Promise<boolean> {

  }

  /**
   * Get all admin favorites.
   *
   * @returns All admin favorited items.
   */
  public async getFavorites(): Promise<AdminFavorites[]> {

  }

  /**
   * Get all admin favorite posts.
   *
   * @returns All admin favorited posts.
   */
  public async getFavoritePosts(): Promise<Post[]> {

  }

  /**
   * Get the n most recent favorited posts.
   *
   * @param num The number of favorited posts to return.
   * @returns Recently made favorited posts.
   */
  public async getRecentFavorites(num: number): Promise<Post[]> {
    
  }
}
