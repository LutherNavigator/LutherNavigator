/**
 * Services for the post table.
 * @packageDocumentation
 */

import { BaseService, getTime, newUniqueID } from "./util";
import { Image } from "./image";
import { Rating, RatingParams } from "./rating";
import { User } from "./user";

/**
 * Post architecture.
 */
export interface Post {
  id: string;
  userID: string;
  content: string;
  location: string;
  city: string;
  country: string;
  locationTypeID: number;
  programID: number;
  ratingID: string;
  threeWords: string;
  currentUserStatusID: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  approved: boolean;
  createTime: number;
  editTime: number | null;
}

/**
 * Post with only ID architecture.
 */
interface PostID {
  id: string;
}

/**
 * Post with only user ID architecture.
 */
interface PostUserID {
  userID: string;
}

/**
 * Post with only rating ID architecture.
 */
interface PostRatingID {
  ratingID: string;
}

/**
 * Post with only content architecture.
 */
interface PostContent {
  content: string;
}

/**
 * Post with only approved architecture.
 */
interface PostApproved {
  approved: boolean;
}

/**
 * Post with only ID and rating ID architecture.
 */
interface PostIDRatingID {
  id: string;
  ratingID: string;
}

/**
 * Unapproved post architecture.
 */
export interface UnapprovedPost {
  postID: string;
  firstname: string;
  lastname: string;
  content: string;
  location: string;
  city: string;
  country: string;
  locationType: string;
  program: string;
  threeWords: string;
  createTime: number;
}

/**
 * User post architecture.
 */
export interface UserPost extends Post {
  program: string;
}

/**
 * Post details architecture.
 */
interface PostDetails {
  content?: string;
  location?: string;
  city?: string;
  country?: string;
  locationTypeID?: number;
  programID?: number;
  threeWords?: string;
  address?: string;
  phone?: string;
  website?: string;
}

/**
 * Post services.
 */
export class PostService extends BaseService {
  /**
   * Create a post.
   *
   * @param userID The ID of the user making the post.
   * @param content The text content of the post.
   * @param imageData The binary data of the images associated with the post.
   * @param location The post's location.
   * @param city The location's city.
   * @param country The location's country.
   * @param locationTypeID The type ID of location.
   * @param programID The ID of the program the user is in.
   * @param rating The user's rating of the location.
   * @param threeWords Three words to describe the location.
   * @param address The location's address.
   * @param phone The location's phone number.
   * @param website The location's website.
   * @returns The new post's ID.
   */
  public async createPost(
    userID: string,
    content: string,
    imageData: Buffer[],
    location: string,
    city: string,
    country: string,
    locationTypeID: number,
    programID: number,
    rating: RatingParams,
    threeWords: string,
    address: string = null,
    phone: string = null,
    website: string = null
  ): Promise<string> {
    const postID = await newUniqueID(this.dbm, "Post");
    const ratingID = await this.dbm.ratingService.createRating(rating);
    const user = await this.dbm.userService.getUser(userID);

    const sql = `
      INSERT INTO Post (
        id, userID, content, location, city, country, locationTypeID,
        programID, ratingID, threeWords, currentUserStatusID, address, phone,
        website, createTime
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?
      );
    `;
    const params = [
      postID,
      userID,
      content,
      location,
      city,
      country,
      locationTypeID,
      programID,
      ratingID,
      threeWords,
      user.statusID,
      address,
      phone,
      website,
      getTime(),
    ];
    await this.dbm.execute(sql, params);

    await this.dbm.postImageService.createPostImages(postID, imageData);
    await this.dbm.userService.updateLastPostTime(userID);

    return postID;
  }

  /**
   * Check if a post exists.
   *
   * @param postID A post's ID.
   * @returns Whether or not the post exists.
   */
  public async postExists(postID: string): Promise<boolean> {
    const sql = `SELECT id FROM Post WHERE id = ?;`;
    const params = [postID];
    const rows: PostID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a post.
   *
   * @param postID A post's ID.
   * @returns The post.
   */
  public async getPost(postID: string): Promise<Post> {
    const sql = `SELECT * FROM Post WHERE id = ?;`;
    const params = [postID];
    const rows: Post[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a post.
   *
   * @param postID A post's ID.
   */
  public async deletePost(postID: string): Promise<void> {
    let sql = `SELECT ratingID FROM Post WHERE id = ?;`;
    let params = [postID];
    let rows: PostRatingID[] = await this.dbm.execute(sql, params);

    await this.dbm.postImageService.deletePostImages(postID);
    await this.dbm.adminFavoritesService.unfavorite(postID);
    await this.dbm.postVoteService.deletePostVotes(postID);

    sql = `DELETE FROM Post WHERE id = ?;`;
    params = [postID];
    await this.dbm.execute(sql, params);

    const ratingID = rows[0]?.ratingID;
    await this.dbm.ratingService.deleteRating(ratingID);
  }

  /**
   * Edit a post, given the parts of the post that have been edited.
   *
   * @param postID A post's ID.
   * @param postDetails The post details.
   */
  public async editPost(
    postID: string,
    postDetails: PostDetails
  ): Promise<void> {
    const newFields = Object.keys(postDetails)
      .filter((field) => field !== undefined && field !== null)
      .map((field) => `${field} = ?`);
    const newValues = Object.keys(postDetails)
      .filter((field) => field !== undefined && field !== null)
      .map((field) => postDetails[field]);

    const sql = `UPDATE Post SET ${newFields.join(", ")} WHERE id = ?;`;
    const params = [...newValues, postID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get the user who made the post.
   *
   * @param postID A post's ID.
   * @returns The user who made the post.
   */
  public async getPostUser(postID: string): Promise<User> {
    const sql = `SELECT userID FROM Post WHERE id = ?;`;
    const params = [postID];
    const rows: PostUserID[] = await this.dbm.execute(sql, params);

    const userID = rows[0]?.userID;
    const user = await this.dbm.userService.getUser(userID);

    return user;
  }

  /**
   * Get a post's rating.
   *
   * @param postID A post's ID.
   * @returns The post's rating.
   */
  public async getPostRating(postID: string): Promise<Rating> {
    const sql = `SELECT ratingID FROM Post WHERE id = ?;`;
    const params = [postID];
    const rows: PostRatingID[] = await this.dbm.execute(sql, params);

    const ratingID = rows[0]?.ratingID;
    const rating = await this.dbm.ratingService.getRating(ratingID);

    return rating;
  }

  /**
   * Get all of a user's posts.
   *
   * @param userID A user's ID.
   * @returns A list of all posts made by the user.
   */
  public async getUserPosts(userID: string): Promise<UserPost[]> {
    const sql = `
      SELECT Post.*, Program.name AS program
        FROM Post
        JOIN Program ON Post.programID = Program.id
      WHERE Post.userID = ?
      ORDER BY Post.createTime;
    `;
    const params = [userID];
    const rows: UserPost[] = await this.dbm.execute(sql, params);

    return rows;
  }

  /**
   * Delete all of a user's posts.
   *
   * @param userID A user's ID.
   */
  public async deleteUserPosts(userID: string): Promise<void> {
    let sql = `SELECT id, ratingID FROM Post WHERE userID = ?;`;
    let params = [userID];
    const rows: PostIDRatingID[] = await this.dbm.execute(sql, params);

    const postIDs = rows.map((post) => post.id);

    for (const postID of postIDs) {
      await this.dbm.postImageService.deletePostImages(postID);
    }

    sql = `DELETE FROM Post WHERE userID = ?;`;
    params = [userID];
    await this.dbm.execute(sql, params);

    const ratingIDs = rows.map((post) => `'${post.ratingID}'`);

    if (ratingIDs.length > 0) {
      sql = `DELETE FROM Rating WHERE id IN (${ratingIDs.join(", ")});`;
      params = [];
      await this.dbm.execute(sql, params);
    }
  }

  /**
   * Get a post's text content.
   *
   * @param postID A post's ID.
   * @returns The post's text content.
   */
  public async getPostContent(postID: string): Promise<string> {
    const sql = `SELECT content FROM Post WHERE id = ?;`;
    const params = [postID];
    const rows: PostContent[] = await this.dbm.execute(sql, params);

    return rows[0]?.content;
  }

  /**
   * Set a post's text content.
   *
   * @param postID A post's ID.
   * @param content The new text content of a post.
   */
  public async setPostContent(postID: string, content: string): Promise<void> {
    const sql = `UPDATE Post SET content = ? WHERE id = ?;`;
    const params = [content, postID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get a post's images.
   *
   * @param postID A post's ID.
   * @returns The images associated with the post.
   */
  public async getPostImages(postID: string): Promise<Image[]> {
    return await this.dbm.postImageService.getPostImages(postID);
  }

  /**
   * Set a post's images.
   *
   * @param postID A post's ID.
   * @param imageData The binary data of the new images.
   * @returns The IDs of the new images.
   */
  public async setPostImages(
    postID: string,
    imageData: Buffer[]
  ): Promise<string[]> {
    return await this.dbm.postImageService.createPostImages(postID, imageData);
  }

  /**
   * Check if a post has been approved.
   *
   * @param postID A post's ID.
   * @returns Whether or not the post has been approved by an admin.
   */
  public async isApproved(postID: string): Promise<boolean> {
    const sql = `SELECT approved FROM Post WHERE id = ?;`;
    const params = [postID];
    const rows: PostApproved[] = await this.dbm.execute(sql, params);

    return !!rows[0]?.approved;
  }

  /**
   * Set a post's approved status.
   *
   * @param postID A post's ID.
   * @param approved Approved status.
   */
  public async setApproved(
    postID: string,
    approved: boolean = true
  ): Promise<void> {
    const sql = `UPDATE Post SET approved = ? WHERE id = ?;`;
    const params = [approved, postID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get all unapproved posts.
   *
   * @returns All unapproved posts.
   */
  public async getUnapproved(): Promise<UnapprovedPost[]> {
    const sql = `
      SELECT
        Post.id AS postID, User.firstname AS firstname,
        User.lastname AS lastname, content, location, city, country,
        LocationType.name AS locationType, Program.name AS program,
        threeWords, createTime
      FROM Post
      JOIN User
        ON Post.userID = User.id
      JOIN LocationType
        ON Post.locationTypeID = LocationType.id
      JOIN Program
        ON Post.programID = Program.id
      WHERE Post.approved = FALSE
      ORDER BY createTime;
    `;
    const rows: UnapprovedPost[] = await this.dbm.execute(sql);

    return rows;
  }
}
