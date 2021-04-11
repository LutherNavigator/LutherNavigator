import { getDBM, closeDBM } from "./util";
import { getTime, checkPassword } from "../../src/services/util";

// Test password reset service
test("PasswordReset", async () => {
  const dbm = await getDBM();

  const firstname = "Martin";
  const lastname = "Luther";
  const email = "lumart01@luther.edu";
  const password = "password123";
  const statusID = 1; // Student

  const userID = await dbm.userService.createUser(
    firstname,
    lastname,
    email,
    password,
    statusID
  );
  await dbm.userService.setVerified(userID);

  // Request password reset
  const resetID = await dbm.passwordResetService.requestPasswordReset(
    email,
    false
  );
  expect(resetID).not.toBeNull();
  expect(resetID.length).toBe(16);

  // Attempt request with invalid email
  const resetID2 = await dbm.passwordResetService.requestPasswordReset(
    "fake_email",
    false
  );
  expect(resetID2).toBeNull();

  // Attempt request with same email address
  const resetID3 = await dbm.passwordResetService.requestPasswordReset(
    email,
    false
  );
  expect(resetID3).toBeNull();

  // Attempt request with unverified account
  await dbm.userService.setVerified(userID, false);
  const resetID4 = await dbm.passwordResetService.requestPasswordReset(
    email,
    false
  );
  expect(resetID4).toBeNull();
  await dbm.userService.setVerified(userID);

  // Check reset record exists
  let recordExists = await dbm.passwordResetService.resetRecordExists(resetID);
  expect(recordExists).toBe(true);

  // Get reset record
  const resetRecord = await dbm.passwordResetService.getResetRecord(resetID);
  expect(resetRecord.id).toBe(resetID);
  expect(resetRecord.email).toBe(email);
  expect(getTime() - resetRecord.createTime).toBeLessThanOrEqual(3);

  // Delete reset record
  await dbm.passwordResetService.deleteResetRecord(resetID);
  recordExists = await dbm.passwordResetService.resetRecordExists(resetID);
  expect(recordExists).toBe(false);

  // Attempt to reset with invalid ID
  let success = await dbm.passwordResetService.resetPassword(
    resetID3,
    "not new password"
  );
  expect(success).toBe(false);

  // Reset password
  const newPassword = "new password";
  const resetID5 = await dbm.passwordResetService.requestPasswordReset(
    email,
    false
  );
  success = await dbm.passwordResetService.resetPassword(resetID5, newPassword);
  expect(success).toBe(true);
  const newHashedPassword = (await dbm.userService.getUser(userID)).password;
  const match = await checkPassword(newPassword, newHashedPassword);
  expect(match).toBe(true);

  // Check record has been removed
  recordExists = await dbm.passwordResetService.resetRecordExists(resetID4);
  expect(recordExists).toBe(false);

  // Attempt to reset with a user that does not exist
  const resetID6 = await dbm.passwordResetService.requestPasswordReset(
    email,
    false
  );
  expect(resetID6).not.toBeNull();
  await dbm.userService.deleteUser(userID);
  success = await dbm.passwordResetService.resetPassword(resetID6, newPassword);
  expect(success).toBeFalsy();

  await closeDBM(dbm);
});
