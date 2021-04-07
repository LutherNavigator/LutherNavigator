/**
 * Database initializer.
 * @packageDocumentation
 */

import DatabaseManager from "./services";
import {
  pruneSessions,
  pruneVerifyRecords,
  prunePasswordResetRecords,
  pruneSuspensions,
} from "./services/util";
import { metaConfig } from "./config";

/**
 * Asynchronously sleep.
 *
 * @param ms Number of milliseconds to wait.
 */
async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Populate a static table.
 *
 * @param dbm The database manager.
 * @param table Table name.
 * @param column Column name.
 * @param values Values to be inserted into the table.
 * @param other Whether or not to insert the "Other" option into the table.
 * @param otherID ID of the "Other" option, if it is set to true.
 */
export async function populateTable(
  dbm: DatabaseManager,
  table: string,
  column: string,
  values: any[],
  other: boolean = false,
  otherID: number = 1000
): Promise<void> {
  const rows = await dbm.execute(`SELECT ${column} FROM ${table};`);

  if (rows.length === 0) {
    let queryValues = values.map(
      (value, index) => `(${index + 1}, '${value}')`
    );

    if (other) {
      queryValues.push(`(${otherID}, 'Other')`);
    }

    const queryValuesStr = queryValues.join(", ");
    const query = `INSERT INTO ${table} (id, ${column}) VALUES ${queryValuesStr};`;
    await dbm.execute(query);
  }
}

/**
 * Initialize values in the meta table.
 *
 * @param dbm The database manager.
 */
export async function initMeta(dbm: DatabaseManager): Promise<void> {
  const metaRows = await dbm.metaService.getAll();
  const allMeta = metaRows.map((row) => row.name);

  for (const item of Object.keys(metaConfig)) {
    if (!allMeta.includes(item)) {
      await dbm.metaService.set(item, String(metaConfig[item]));
    }
  }
}

/**
 * Switch to using a single database connection.
 *
 * @param dbm The database manager.
 */
export async function useConnection(dbm: DatabaseManager): Promise<void> {
  const conn = await dbm.db.getConnection();
  dbm.db.setConnection(conn);
}

/**
 * Switch to using the database connection pool.
 *
 * @param dbm The database manager.
 */
export async function clearConnection(dbm: DatabaseManager): Promise<void> {
  dbm.db.setConnection(null);
}

/**
 * Initialize the database.
 *
 * @param dbm The database manager.
 */
export default async function initDB(
  dbm: DatabaseManager,
  prune: boolean = true
): Promise<void> {
  // Create tables
  const imageTable = `
    CREATE TABLE IF NOT EXISTS Image (
      id           CHAR(4)           NOT NULL,
      data         VARBINARY(262144) NOT NULL,
      registerTime INT UNSIGNED      NOT NULL,

      PRIMARY KEY (id)
    );
  `;
  const userStatusTable = `
    CREATE TABLE IF NOT EXISTS UserStatus (
      id   INT         NOT NULL,
      name VARCHAR(63) NOT NULL,

      PRIMARY KEY (id)
    );
  `;
  const locationTypeTable = `
    CREATE TABLE IF NOT EXISTS LocationType (
      id   INT         NOT NULL,
      name VARCHAR(63) NOT NULL,

      PRIMARY KEY (id)
    );
  `;
  const programTable = `
    CREATE TABLE IF NOT EXISTS Program (
      id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,

      PRIMARY KEY (id)
    );
  `;
  const ratingTable = `
    CREATE TABLE IF NOT EXISTS Rating (
      id            CHAR(4) NOT NULL,
      general       TINYINT NOT NULL,
      cost          TINYINT,
      quality       TINYINT,
      safety        TINYINT,
      cleanliness   TINYINT,
      guestServices TINYINT,

      PRIMARY KEY (id)
    );
  `;
  const userTable = `
    CREATE TABLE IF NOT EXISTS User (
      id            CHAR(4)      NOT NULL,
      firstname     VARCHAR(63)  NOT NULL,
      lastname      VARCHAR(63)  NOT NULL,
      email         VARCHAR(63)  NOT NULL,
      password      VARCHAR(255) NOT NULL,
      statusID      INT          NOT NULL,
      verified      BOOL         NOT NULL DEFAULT FALSE,
      approved      BOOL         NOT NULL DEFAULT FALSE,
      admin         BOOL         NOT NULL DEFAULT FALSE,
      imageID       CHAR(4),
      joinTime      INT UNSIGNED NOT NULL,
      lastLoginTime INT UNSIGNED,
      lastPostTime  INT UNSIGNED,

      PRIMARY KEY (id),

      FOREIGN KEY (imageID)
        REFERENCES Image (id),

      FOREIGN KEY (statusID)
        REFERENCES UserStatus (id)
    );
  `;
  const postTable = `
    CREATE TABLE IF NOT EXISTS Post (
      id                  CHAR(4)      NOT NULL,
      userID              CHAR(4)      NOT NULL,
      content             VARCHAR(750) NOT NULL,
      location            VARCHAR(255) NOT NULL,
      locationTypeID      INT          NOT NULL,
      programID           INT UNSIGNED NOT NULL,
      ratingID            CHAR(4)      NOT NULL,
      threeWords          VARCHAR(63)  NOT NULL,
      currentUserStatusID INT          NOT NULL,
      address             VARCHAR(255),
      phone               VARCHAR(13),
      website             VARCHAR(255),
      approved            BOOL         NOT NULL DEFAULT FALSE,
      createTime          INT UNSIGNED NOT NULL,
      editTime            INT UNSIGNED,

      PRIMARY KEY (id),

      FOREIGN KEY (userID)
        REFERENCES User (id),

      FOREIGN KEY (locationTypeID)
        REFERENCES LocationType (id),

      FOREIGN KEY (programID)
        REFERENCES Program (id),

      FOREIGN KEY (ratingID)
        REFERENCES Rating (id),

      FOREIGN KEY (currentUserStatusID)
        REFERENCES UserStatus (id)
    );
  `;
  const postImageTable = `
    CREATE TABLE IF NOT EXISTS PostImage (
      id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
      postID  CHAR(4)      NOT NULL,
      imageID CHAR(4)      NOT NULL,

      PRIMARY KEY (id),

      FOREIGN KEY (postID)
        REFERENCES Post (id),

      FOREIGN KEY (imageID)
        REFERENCES Image (id)
    );
  `;
  const sessionTable = `
    CREATE TABLE IF NOT EXISTS Session (
      id         CHAR(16)     NOT NULL,
      userID     CHAR(4)      NOT NULL,
      createTime INT UNSIGNED NOT NULL,
      updateTime INT UNSIGNED NOT NULL,

      PRIMARY KEY (id),

      FOREIGN KEY (userID)
        REFERENCES User (id)
    );
  `;
  const verifyTable = `
    CREATE TABLE IF NOT EXISTS Verify (
      id         CHAR(16)     NOT NULL,
      email      VARCHAR(63)  NOT NULL,
      createTime INT UNSIGNED NOT NULL,

      PRIMARY KEY (id)
    );
  `;
  const passwordResetTable = `
    CREATE TABLE IF NOT EXISTS PasswordReset (
      id         CHAR(16)     NOT NULL,
      email      VARCHAR(63)  NOT NULL,
      createTime INT UNSIGNED NOT NULL,

      PRIMARY KEY (id)
    );
  `;
  const userStatusChangeTable = `
    CREATE TABLE IF NOT EXISTS UserStatusChange (
      id          CHAR(4)      NOT NULL,
      userID      CHAR(4)      NOT NULL,
      newStatusID INT          NOT NULL,
      createTime  INT UNSIGNED NOT NULL,

      PRIMARY KEY (id),

      FOREIGN KEY (userID)
        REFERENCES User (id),

      FOREIGN KEY (newStatusID)
        REFERENCES UserStatus (id)
    );
  `;
  const suspendedTable = `
    CREATE TABLE IF NOT EXISTS Suspended (
      id             CHAR(4)      NOT NULL,
      userID         CHAR(4)      NOT NULL,
      suspendedUntil INT UNSIGNED NOT NULL,
      createTime     INT UNSIGNED NOT NULL,

      PRIMARY KEY (id),

      FOREIGN KEY (userID)
        REFERENCES User (id)
    );
  `;
  const metaTable = `
    CREATE TABLE IF NOT EXISTS Meta (
      name  VARCHAR(255) NOT NULL,
      value TEXT         NOT NULL,

      PRIMARY KEY (name)
    );
  `; // MySQL fails to parse 'key' as a column name, so we use 'name' instead
  const adminFavoritesTable = `
    CREATE TABLE IF NOT EXISTS AdminFavorites (
      id         CHAR(4)      NOT NULL,
      postID     CHAR(4)      NOT NULL,
      createTime INT UNSIGNED NOT NULL,

      PRIMARY KEY (id),

      FOREIGN KEY (postID)
        REFERENCES Post (id)
    );
  `;
  const postVoteTable = `
    CREATE TABLE IF NOT EXISTS PostVote (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      userID     CHAR(4)      NOT NULL,
      postID     CHAR(4)      NOT NULL,
      voteType   VARCHAR(64)  NOT NULL,
      createTime INT UNSIGNED NOT NULL,

      PRIMARY KEY (id),

      FOREIGN KEY (userID)
        REFERENCES User (id),

      FOREIGN KEY (postID)
        REFERENCES Post (id)
    );
  `;
  await dbm.db.executeMany([
    imageTable,
    userStatusTable,
    locationTypeTable,
    programTable,
    ratingTable,
    userTable,
    postTable,
    postImageTable,
    sessionTable,
    verifyTable,
    passwordResetTable,
    userStatusChangeTable,
    suspendedTable,
    metaTable,
    adminFavoritesTable,
    postVoteTable,
  ]);

  // Create triggers
  // ClearDB does not support triggers :/
  // const userDeleteTrigger = `
  //   CREATE TRIGGER AfterUserDelete
  //     AFTER DELETE
  //     ON User FOR EACH ROW
  //   BEGIN
  //     DELETE FROM Image WHERE id = OLD.imageID;
  //     DELETE FROM Post WHERE userID = OLD.id;
  //   END;
  // `;
  // const postDeleteTrigger = `
  //   CREATE TRIGGER AfterPostDelete
  //     AFTER DELETE
  //     ON Post FOR EACH ROW
  //   DELETE FROM Image WHERE id = OLD.imageID;
  // `;
  // await dbm.executeMany([userDeleteTrigger, postDeleteTrigger]);

  await wait(1000);

  // Populate static tables
  await populateTable(
    dbm,
    "UserStatus",
    "name",
    ["Student", "Alum", "Faculty/Staff", "Parent"],
    true
  );
  await populateTable(
    dbm,
    "LocationType",
    "name",
    [
      "Hotel",
      "Hostel",
      "B&B/Inn",
      "Cafe/Bakery",
      "Bar/Pub",
      "Restaurant",
      "Museum",
      "Arts venue",
      "Sports venue",
      "Cultural attraction",
      "Historical attraction",
    ],
    true
  );

  // Populate meta table
  await initMeta(dbm);

  // Prune records from the database
  if (prune) {
    await pruneSessions(dbm);
    await pruneVerifyRecords(dbm);
    await prunePasswordResetRecords(dbm);
    await pruneSuspensions(dbm);
  }
}
