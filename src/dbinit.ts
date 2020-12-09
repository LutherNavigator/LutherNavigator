/**
 * Database initializer.
 * @packageDocumentation
 */

import mainDB from "./services/util";

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
 * @param table Table name.
 * @param column Column name.
 * @param values Values to be inserted into the table.
 * @param other Whether or not to insert the "Other" option into the table.
 * @param otherID ID of the "Other" option, if it is set to true.
 */
export async function populateTable(
  table: string,
  column: string,
  values: any[],
  other: boolean = false,
  otherID: number = 1000
): Promise<void> {
  const rows = await mainDB.execute(`SELECT ${column} from ${table}`);

  if (rows.length === 0) {
    let queryValues = values.map(
      (value, index) => `(${index + 1}, '${value}')`
    );

    if (other) {
      queryValues.push(`(${otherID}, 'Other')`);
    }

    const queryValuesStr = queryValues.join(", ");
    const query = `INSERT INTO ${table} (id, ${column}) VALUES ${queryValuesStr};`;
    await mainDB.execute(query);
  }
}

/**
 * Initialize the database.
 */
export default async function initDB(): Promise<void> {
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
      id             CHAR(4)       NOT NULL,
      userID         CHAR(4)       NOT NULL,
      content        VARCHAR(750)  NOT NULL,
      imageID        CHAR(4)       NOT NULL,
      location       VARCHAR(255)  NOT NULL,
      locationTypeID INT           NOT NULL,
      program        VARCHAR(255)  NOT NULL,
      ratingID       CHAR(4)       NOT NULL,
      threeWords     VARCHAR(63)   NOT NULL,
      approved       BOOL          NOT NULL DEFAULT FALSE,
      createTime     INT UNSIGNED  NOT NULL,
      editTime       INT UNSIGNED,

      PRIMARY KEY (id),

      FOREIGN KEY (userID)
        REFERENCES User (id),

      FOREIGN KEY (imageID)
        REFERENCES Image (id),
      
      FOREIGN KEY (locationTypeID)
        REFERENCES LocationType (id),

      FOREIGN KEY (ratingID)
        REFERENCES Rating (id)
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
  const metaTable = `
    CREATE TABLE IF NOT EXISTS Meta (
      name  VARCHAR(255) NOT NULL,
      value TEXT         NOT NULL,

      PRIMARY KEY (name)
    );
  `; // MySQL fails to parse 'key' as a column name, so we use 'name' instead
  await mainDB.executeMany([
    imageTable,
    userStatusTable,
    locationTypeTable,
    ratingTable,
    userTable,
    postTable,
    sessionTable,
    metaTable,
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
  // await mainDB.executeMany([userDeleteTrigger, postDeleteTrigger]);

  await wait(1000);

  // Populate static tables
  await populateTable(
    "UserStatus",
    "name",
    ["Student", "Alum", "Faculty/Staff", "Parent"],
    true
  );
  await populateTable(
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
}
