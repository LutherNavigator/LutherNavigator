/**
 * Services for the program table.
 * @packageDocumentation
 */

import { BaseService } from "./util";

/**
 * Program architecture.
 */
export interface Program {
  id: number;
  name: string;
}

/**
 * Program services.
 */
export class ProgramService extends BaseService {
  /**
   * Create a new program.
   *
   * @param name The new program's name.
   * @returns The new program's ID.
   */
  public async createProgram(name: string): Promise<number> {
    const sql1 = `
      INSERT INTO Program (
        name
      ) VALUES (
        ?
      );
    `;
    const sql2 = `SELECT LAST_INSERT_ID() AS id;`;
    const params1 = [name];
    const rows = await this.dbm.db.executeMany([sql1, sql2], [params1, []]);

    return rows[1][0].id;
  }

  /**
   * Check if a program exists.
   *
   * @param programID A program's ID.
   * @returns Whether or not the program exists.
   */
  public async programExists(programID: number): Promise<boolean> {
    const sql = `SELECT id FROM Program WHERE id = ?;`;
    const params = [programID];
    const rows: Program[] = await this.dbm.execute(sql, params);

    return rows.length > 0;
  }

  /**
   * Get a program.
   *
   * @param programID A program's ID.
   * @returns The program.
   */
  public async getProgram(programID: number): Promise<Program> {
    const sql = `SELECT * FROM Program WHERE id = ?;`;
    const params = [programID];
    const rows: Program[] = await this.dbm.execute(sql, params);

    return rows[0];
  }

  /**
   * Delete a program.
   * @param programID A program's ID.
   */
  public async deleteProgram(programID: number): Promise<void> {
    const sql = `DELETE FROM Program WHERE id = ?;`;
    const params = [programID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get a program's name.
   *
   * @param programID A program's ID.
   * @returns The program's name.
   */
  public async getProgramName(programID: number): Promise<string> {
    const sql = `SELECT name FROM Program WHERE id = ?;`;
    const params = [programID];
    const rows: Program[] = await this.dbm.execute(sql, params);

    return rows[0].name;
  }

  /**
   * Set a program's name.
   *
   * @param programID A program's ID.
   * @param newName The program's new name.
   */
  public async setProgramName(
    programID: number,
    newName: string
  ): Promise<void> {
    const sql = `UPDATE Program SET name = ? WHERE id = ?;`;
    const params = [newName, programID];
    await this.dbm.execute(sql, params);
  }

  /**
   * Get all programs.
   *
   * @returns All programs.
   */
  public async getPrograms(): Promise<Program[]> {
    const sql = `SELECT * FROM Program;`;
    const params = [];
    const rows: Program[] = await this.dbm.execute(sql, params);

    return rows;
  }

  /**
   * Get the number of posts associated with a program.
   *
   * @param programID A program's ID.
   * @returns The number of linked posts.
   */
  public async numLinkedPosts(programID: number): Promise<number> {
    const sql = `SELECT COUNT(*) AS posts FROM Post WHERE programID = ?;`;
    const params = [programID];
    const rows = await this.dbm.execute(sql, params);

    return rows[0].posts;
  }
}
