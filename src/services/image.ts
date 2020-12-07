/**
 * Services for the image table.
 * @packageDocumentation
 */

import mainDB, { getTime, newUniqueID } from "./util";

/**
 * Image architecture.
 */
export interface Image {
  id: string;
  data: Buffer;
  registerTime: number;
}

/**
 * Image services.
 */
export module ImageService {
  /**
   * Create an image.
   * 
   * @param data Image binary data.
   * @returns The new image's ID.
   */
  export async function createImage(data: Buffer): Promise<string> {
    const imageID = await newUniqueID("Image");

    const sql = `INSERT INTO Image (id, data, registerTime) VALUES (?, ?, ?);`;
    const params = [imageID, data, getTime()];
    await mainDB.execute(sql, params);

    return imageID;
  }

  /**
   * Check if an image exists.
   * 
   * @param imageID An image's ID.
   * @returns Whether or not the image exists.
   */
  export async function imageExists(imageID: string): Promise<boolean> {
    const sql = `SELECT id FROM Image WHERE id = ?;`;
    const params = [imageID];
    const rows: Image[] = await mainDB.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get an image.
   * 
   * @param imageID An image's ID.
   * @returns The image.
   */
  export async function getImage(imageID: string): Promise<Image> {
    const sql = `SELECT * from Image WHERE id = ?;`;
    const params = [imageID];
    const rows: Image[] = await mainDB.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete an image.
   * 
   * @param imageID An image's ID.
   */
  export async function deleteImage(imageID: string): Promise<void> {
    const sql = `DELETE FROM Image WHERE id = ?;`;
    const params = [imageID];
    await mainDB.execute(sql, params);
  }
}
