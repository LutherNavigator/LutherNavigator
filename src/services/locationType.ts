/**
 * Services for the location type table.
 * @packageDocumentation
 */

import { BaseService } from "./util";

/**
 * Location type architecture.
 */
export interface LocationType {
  id: number;
  name: string;
}

/**
 * Location type with only ID architecture.
 */
interface LocationTypeID {
  id: number;
}

/**
 * Location type with only name architecture.
 */
interface LocationTypeName {
  name: string;
}

/**
 * Location type services.
 */
export class LocationTypeService extends BaseService {
  /**
   * Get all locations.
   *
   * @returns All location types.
   */
  public async getLocations(): Promise<LocationType[]> {
    const sql = `SELECT * FROM LocationType ORDER BY id;`;
    const rows: LocationType[] = await this.dbm.execute(sql);

    return rows;
  }

  /**
   * Get the name of a location by ID.
   *
   * @param locationID A location's ID.
   * @returns The location's name.
   */
  public async getLocationName(locationID: number): Promise<string> {
    const sql = `SELECT name FROM LocationType WHERE id = ?;`;
    const params = [locationID];
    const rows: LocationTypeName[] = await this.dbm.execute(sql, params);

    return rows[0]?.name;
  }

  /**
   * Check if a location is valid.
   *
   * @param locationID A location's ID.
   * @returns Whether or not the location is valid.
   */
  public async validLocation(locationID: number): Promise<boolean> {
    const sql = `SELECT id FROM LocationType WHERE id = ?;`;
    const params = [locationID];
    const rows: LocationTypeID[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }
}
