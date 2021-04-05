import { getDBM, closeDBM, wait } from "./util";
import {
  idLength,
  getTime,
  setBigTimeout,
  newID,
  newUniqueID,
  hashPasswordAsync,
  hashPassword,
  checkPassword,
  pruneSession,
  pruneVerifyRecord,
  prunePasswordResetRecord,
  pruneSuspension,
} from "../../src/services/util";

// Test util functions
test("Util", async () => {
  const dbm = await getDBM();

  // Get time
  const now = getTime() * 1000;
  expect(new Date().getTime() - now).toBeLessThan(1000);

  // Set big timeout
  const value = await (async (): Promise<number> => {
    return new Promise((resolve) => {
      setBigTimeout(resolve, 0, 1);
    });
  })();
  expect(value).toBe(1);

  // Get new ID
  const theID = await newID();
  expect(theID.length).toBe(idLength);

  // Get new unique ID
  const userID = await newUniqueID(dbm, "User");
  expect(userID.length).toBe(idLength);

  // Hash password
  const password = "password123";
  const hash1 = await hashPasswordAsync(password, 12);
  expect(hash1).not.toBe(password);

  // Hash password
  const hash2 = await hashPassword(dbm, password);
  expect(hash2).not.toBe(password);

  // Check hashed password
  let same = await checkPassword(password, hash2);
  expect(same).toBe(true);

  // Check invalid password
  same = await checkPassword(password + "4", hash2);
  expect(same).toBe(false);

  // Prune session, verify, password reset, suspension
  await pruneSession(dbm, "!!!!", 0);
  await pruneVerifyRecord(dbm, "!!!!", 0);
  await prunePasswordResetRecord(dbm, "!!!!", 0);
  await pruneSuspension(dbm, "!!!!", 0);

  await wait(1000);

  await closeDBM(dbm);
});
