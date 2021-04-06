/**
 * Services for the meta table.
 * @packageDocumentation
 */

import { BaseService } from "./util";

/**
 * Meta architecture.
 */
export interface Meta {
  name: string;
  value: string;
}

/**
 * Meta with only name architecture.
 */
interface MetaName {
  name: string;
}

/**
 * Meta with only value architecture.
 */
interface MetaValue {
  value: string;
}

/**
 * Meta services.
 */
export class MetaService extends BaseService {
  /**
   * Check if a key name exists.
   *
   * @param name The key name.
   * @returns Whether or not the name exists.
   */
  public async exists(name: string): Promise<boolean> {
    const sql = `SELECT name FROM Meta WHERE name = ?;`;
    const params = [name];
    const rows: MetaName[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get the value given the key name.
   *
   * @param name The key name.
   * @returns The value.
   */
  public async get(name: string): Promise<string> {
    const sql = `SELECT value FROM Meta WHERE name = ?;`;
    const params = [name];
    const rows: MetaValue[] = await this.dbm.execute(sql, params);

    return rows[0]?.value;
  }

  /**
   * Set the key name and value.
   *
   * @param name The key name.
   * @param value The value.
   */
  public async set(name: string, value: string): Promise<void> {
    const nameExists = await this.exists(name);

    let sql: string;
    let params: string[];

    if (!nameExists) {
      sql = `
				INSERT INTO Meta (
					name, value
				) VALUES (
					?, ?
				);
			`;
      params = [name, value];
    } else {
      sql = `UPDATE Meta SET value = ? WHERE name = ?;`;
      params = [value, name];
    }

    await this.dbm.execute(sql, params);
  }

  /**
   * Delete the key name and value.
   *
   * @param name The key name.
   */
  public async remove(name: string): Promise<void> {
    const sql = `DELETE FROM Meta WHERE name = ?;`;
    const params = [name];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get all key names and values.
   *
   * @returns Key names and values.
   */
  public async getAll(): Promise<Meta[]> {
    const sql = `SELECT * FROM Meta;`;
    const params = [];
    const rows: Meta[] = await this.dbm.execute(sql, params);

    return rows;
  }
}
