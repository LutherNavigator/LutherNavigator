/**
 * Services for the post image table.
 * @packageDocumentation
 */

import { BaseService } from "./util";
import { Image } from "./image";

/**
 * Post image architecture.
 */
export interface PostImage {
  postID: string;
  imageID: string;
}

/**
 * Post image count architecture.
 */
interface PostImageCount {
  count: number;
}

/**
 * Post image with only ID architecture.
 */
interface PostImageID {
  imageID: string;
}

/**
 * Post image services.
 */
export class PostImageService extends BaseService {
  /**
   * Get all images associated with a post.
   *
   * @param postID A post's ID.
   * @returns The images associated with the post.
   */
  public async getPostImages(postID: string): Promise<Image[]> {
    const sql = `
      SELECT Image.*
        FROM Image
        JOIN (
          SELECT * FROM PostImage WHERE postID = ?
        ) AS PostImageRecords ON Image.id = PostImageRecords.imageID
      ORDER BY PostImageRecords.id;
    `;
    const params = [postID];
    const rows: Image[] = await this.dbm.execute(sql, params);

    return rows;
  }

  /**
   * Associate an image with a post.
   *
   * @param postID A post's ID.
   * @param imageID An image's ID.
   */
  public async setPostImage(postID: string, imageID: string): Promise<void> {
    const sql = `
      INSERT INTO PostImage (
        postID, imageID
      ) VALUES (
        ?, ?
      );
    `;
    const params = [postID, imageID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Create a new image and associate it with a post.
   *
   * @param postID A post's ID.
   * @param imageData The binary data of the new image.
   * @returns The new image's ID.
   */
  public async createPostImage(
    postID: string,
    imageData: Buffer
  ): Promise<string> {
    const imageID = await this.dbm.imageService.createImage(imageData);
    await this.setPostImage(postID, imageID);

    return imageID;
  }

  /**
   * Create new images and associate them with a post.
   *
   * @param postID A post's ID.
   * @param imageData The binary data of the new images.
   * @returns The IDs of the new images.
   */
  public async createPostImages(
    postID: string,
    imageData: Buffer[]
  ): Promise<string[]> {
    let imageIDs: string[] = [];

    for (const data of imageData) {
      const imageID = await this.createPostImage(postID, data);
      imageIDs.push(imageID);
    }

    return imageIDs;
  }

  /**
   * Get the number of images associated with a post.
   *
   * @param postID A post's ID.
   * @returns The number of images associated with the post.
   */
  public async numImages(postID: string): Promise<number> {
    const sql = `SELECT COUNT(*) AS count FROM PostImage WHERE postID = ?;`;
    const params = [postID];
    const rows: PostImageCount[] = await this.dbm.execute(sql, params);

    return rows[0].count;
  }

  /**
   * Delete all images associated with a post.
   *
   * @param postID A post's ID.
   */
  public async deletePostImages(postID: string): Promise<void> {
    let sql = `SELECT imageID FROM PostImage WHERE postID = ?`;
    let params: any = [postID];
    const rows: PostImageID[] = await this.dbm.execute(sql, params);

    const imageIDs = rows.map((postImage) => postImage.imageID);

    sql = `DELETE FROM PostImage WHERE postID = ?;`;
    params = [postID];
    await this.dbm.execute(sql, params);

    if (imageIDs.length > 0) {
      sql = `DELETE FROM Image WHERE id IN (?);`;
      params = [imageIDs];
      await this.dbm.execute(sql, params);
    }
  }

  /**
   * Delete a specific image from a post.
   *
   * @param postID A post's ID.
   * @param index The index of the post's image.
   * @returns Whether or not the deletion succeeded.
   */
  public async deletePostImage(
    postID: string,
    index: number
  ): Promise<boolean> {
    const images = await this.getPostImages(postID);

    if (index >= 0 && index < images.length) {
      const sql = `DELETE FROM PostImage WHERE imageID = ?;`;
      const params = [images[index].id];
      await this.dbm.execute(sql, params);

      await this.dbm.imageService.deleteImage(images[index].id);

      return true;
    } else {
      return false;
    }
  }
}
