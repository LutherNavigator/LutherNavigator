import { getDBM, closeDBM } from "./util";
import { getTime } from "../../src/services/util";

// Test verify service
test("Verify", async () => {
  const dbm = await getDBM();

  const firstname = "Martin";
  const lastname = "Luther";
  const email = "lumart01@luther.edu";
  const password = "password123";
  const statusID = 1; // Student

  // Create verification record
  const verifyID = await dbm.verifyService.createVerifyRecord(email, false);
  expect(verifyID).not.toBeNull();
  expect(verifyID.length).toBe(16);

  // Create user record
  const userID = await dbm.userService.createUser(
    firstname,
    lastname,
    email,
    password,
    statusID
  );

  // Attempt verification with email that already exists
  const userID2 = await dbm.userService.createUser(
    firstname,
    lastname,
    "email",
    password,
    statusID
  );
  const verifyID2 = await dbm.verifyService.createVerifyRecord("email", false);
  expect(verifyID2).toBeNull();
  await dbm.userService.deleteUser(userID2);

  // Attempt verification with the same email
  const verifyID3 = await dbm.verifyService.createVerifyRecord(email, false);
  expect(verifyID3).toBeNull();

  // Check verification record exists
  let recordExists = await dbm.verifyService.verifyRecordExists(verifyID);
  expect(recordExists).toBe(true);

  // Get verification record
  const verifyRecord = await dbm.verifyService.getVerifyRecord(verifyID);
  expect(verifyRecord.id).toBe(verifyID);
  expect(verifyRecord.email).toBe(email);
  expect(verifyRecord.createTime - getTime()).toBeLessThanOrEqual(3);

  // Delete verification record
  await dbm.verifyService.deleteVerifyRecord(verifyID);
  recordExists = await dbm.verifyService.verifyRecordExists(verifyID);
  expect(recordExists).toBe(false);

  // Attempt to verify with invalid ID
  let success = await dbm.verifyService.verifyUser(verifyID3);
  expect(success).toBe(false);
  await dbm.userService.deleteUser(userID);

  // Verify user
  const verifyID4 = await dbm.verifyService.createVerifyRecord(email, false);
  const userID3 = await dbm.userService.createUser(
    firstname,
    lastname,
    email,
    password,
    statusID
  );
  let verified = (await dbm.userService.getUser(userID3)).verified;
  expect(verified).toBeFalsy();
  success = await dbm.verifyService.verifyUser(verifyID4);
  expect(success).toBe(true);
  verified = (await dbm.userService.getUser(userID3)).verified;
  expect(verified).toBeTruthy();

  // Check record has been removed
  recordExists = await dbm.verifyService.verifyRecordExists(verifyID4);
  expect(recordExists).toBe(false);
  await dbm.userService.deleteUser(userID3);

  // Delete unverified user
  const verifyID5 = await dbm.verifyService.createVerifyRecord(email, false);
  const userID4 = await dbm.userService.createUser(
    firstname,
    lastname,
    email,
    password,
    statusID
  );
  let userExists = await dbm.userService.userExists(userID4);
  expect(userExists).toBe(true);
  const userVerified = await dbm.userService.isVerified(userID4);
  expect(userVerified).toBe(false);
  await dbm.verifyService.deleteUnverifiedUser(verifyID5);
  userExists = await dbm.userService.userExists(userID4);
  expect(userExists).toBe(false);
  recordExists = await dbm.verifyService.verifyRecordExists(verifyID5);
  expect(recordExists).toBe(false);

  // Attempt to verify a user that does not exist
  const verifyID6 = await dbm.verifyService.createVerifyRecord(email, false);
  success = await dbm.verifyService.verifyUser(verifyID6);
  expect(success).toBe(false);

  // Attempt to create a record with the same email
  const verifyID7 = await dbm.verifyService.createVerifyRecord(email, false);
  expect(verifyID7).toBeNull();
  await dbm.verifyService.deleteVerifyRecord(verifyID6);

  await closeDBM(dbm);
});
