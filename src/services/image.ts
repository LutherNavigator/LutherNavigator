/**
 * Services for the image table.
 * @packageDocumentation
 */

import { BaseService, getTime, newUniqueID } from "./util";

/**
 * Image architecture.
 */
export interface Image {
  id: string;
  data: Buffer;
  registerTime: number;
}

/**
 * Image with only ID architecture.
 */
interface ImageID {
  id: string;
}

/**
 * Image services.
 */
export class ImageService extends BaseService {
  /**
   * Create an image.
   *
   * @param data Image binary data.
   * @returns The new image's ID.
   */
  public async createImage(data: Buffer): Promise<string> {
    const imageID = await newUniqueID(this.dbm, "Image");

    const sql = `INSERT INTO Image (id, data, registerTime) VALUES (?, ?, ?);`;
    const params = [imageID, data, getTime()];
    await this.dbm.execute(sql, params);

    return imageID;
  }

  /**
   * Check if an image exists.
   *
   * @param imageID An image's ID.
   * @returns Whether or not the image exists.
   */
  public async imageExists(imageID: string): Promise<boolean> {
    const sql = `SELECT id FROM Image WHERE id = ?;`;
    const params = [imageID];
    const rows: ImageID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get an image.
   *
   * @param imageID An image's ID.
   * @returns The image.
   */
  public async getImage(imageID: string): Promise<Image> {
    const sql = `SELECT * from Image WHERE id = ?;`;
    const params = [imageID];
    const rows: Image[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete an image.
   *
   * @param imageID An image's ID.
   */
  public async deleteImage(imageID: string): Promise<void> {
    const sql = `DELETE FROM Image WHERE id = ?;`;
    const params = [imageID];
    await this.dbm.execute(sql, params);
  }
}
