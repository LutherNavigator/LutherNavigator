/**
 * Services for the rating table.
 * @packageDocumentation
 */

import { BaseService, newUniqueID } from "./util";

/**
 * Rating architecture.
 */
export interface Rating {
  id: string;
  general: number;
  cost: number | null;
  quality: number | null;
  safety: number | null;
  cleanliness: number | null;
  guestServices: number | null;
}

/**
 * Rating parameters.
 */
export interface RatingParams {
  general: number;
  cost?: number;
  quality?: number;
  safety?: number;
  cleanliness?: number;
  guestService?: number;
}

/**
 * Rating with only ID architecture.
 */
interface RatingID {
  id: string;
}

/**
 * Rating services.
 */
export class RatingService extends BaseService {
  /**
   * Create a rating.
   *
   * @param rating The user's rating.
   * @returns The new rating's ID.
   */
  public async createRating(rating: RatingParams): Promise<string> {
    const ratingID = await newUniqueID(this.dbm, "Rating");
    const cols = Object.keys(rating);
    const values = Object.values(rating);

    const sql = `
      INSERT INTO Rating (
        id, ${cols.join(", ")}
      ) VALUES (
        ?, ${"?, ".repeat(values.length).slice(0, -2)}
      );
    `;
    const params = [ratingID, ...values];
    await this.dbm.execute(sql, params);

    return ratingID;
  }

  /**
   * Check if a rating exists.
   *
   * @param ratingID A rating's ID.
   * @returns Whether or not the rating exists.
   */
  public async ratingExists(ratingID: string): Promise<boolean> {
    const sql = `SELECT id FROM Rating WHERE id = ?;`;
    const params = [ratingID];
    const rows: RatingID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a rating.
   *
   * @param ratingID A rating's ID.
   * @returns The rating.
   */
  public async getRating(ratingID: string): Promise<Rating> {
    const sql = `SELECT * FROM Rating WHERE id = ?;`;
    const params = [ratingID];
    const rows: Rating[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a rating.
   *
   * @param ratingID A rating's ID.
   */
  public async deleteRating(ratingID: string): Promise<void> {
    const sql = `DELETE FROM Rating WHERE id = ?;`;
    const params = [ratingID];
    await this.dbm.execute(sql, params);
  }
}
