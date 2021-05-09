import { getDBM, closeDBM } from "./util";
import { getTime } from "../../src/services/util";

// Test email change service
test("Email Change", async () => {
  const dbm = await getDBM();

  const firstname = "Martin";
  const lastname = "Luther";
  const email = "lumart01@luther.edu";
  const password = "password123";
  const statusID = 1; // Student

  const newEmail = "lumart02@luther.edu";
  const newEmail2 = "lumart03@luther.edu";

  // Create email change record
  const emailChangeID = await dbm.emailChangeService.createEmailChangeRecord(
    "!!!!",
    newEmail,
    false
  );
  expect(emailChangeID).toBeNull();

  // Create user
  const userID = await dbm.userService.createUser(
    firstname,
    lastname,
    email,
    password,
    statusID
  );

  // Create email change record
  const emailChangeID2 = await dbm.emailChangeService.createEmailChangeRecord(
    userID,
    newEmail,
    false
  );
  expect(emailChangeID2).not.toBeNull();
  expect(emailChangeID2.length).toBe(16);

  // Attempt email change with existing email change record
  const emailChangeID3 = await dbm.emailChangeService.createEmailChangeRecord(
    userID,
    newEmail2,
    false
  );
  expect(emailChangeID3).not.toBeNull();
  expect(emailChangeID3.length).toBe(16);
  expect(emailChangeID3).toBe(emailChangeID2);

  // Check email change record exists
  let emailExists = await dbm.emailChangeService.emailChangeRecordExists(
    emailChangeID2
  );
  expect(emailExists).toBeTruthy();

  // Check email change record exists with user ID
  emailExists = await dbm.emailChangeService.emailChangeRecordExistsByUserID(
    userID
  );
  expect(emailExists).toBeTruthy();

  // Get email change record
  let emailChangeRecord = await dbm.emailChangeService.getEmailChangeRecord(
    emailChangeID2
  );
  expect(emailChangeRecord).not.toBeNull();
  expect(emailChangeRecord.id).toBe(emailChangeID2);
  expect(emailChangeRecord.userID).toBe(userID);
  expect(emailChangeRecord.newEmail).toBe(newEmail2);
  expect(getTime() - emailChangeRecord.createTime).toBeLessThanOrEqual(3);

  // Get email change record by user ID
  emailChangeRecord = await dbm.emailChangeService.getEmailChangeRecordByUserID(
    userID
  );
  expect(emailChangeRecord).not.toBeNull();
  expect(emailChangeRecord.id).toBe(emailChangeID2);
  expect(emailChangeRecord.userID).toBe(userID);
  expect(emailChangeRecord.newEmail).toBe(newEmail2);
  expect(getTime() - emailChangeRecord.createTime).toBeLessThanOrEqual(3);

  // Edit email change record
  const emailChangeID4 = await dbm.emailChangeService.editEmailChangeRecord(
    userID,
    newEmail
  );
  expect(emailChangeID4).toBe(emailChangeID2);
  emailChangeRecord = await dbm.emailChangeService.getEmailChangeRecord(
    emailChangeID4
  );
  expect(emailChangeRecord).not.toBeNull();
  expect(emailChangeRecord.newEmail).toBe(newEmail);

  // Edit email change record for missing user
  const emailChangeID5 = await dbm.emailChangeService.editEmailChangeRecord(
    "!!!!",
    newEmail2
  );
  expect(emailChangeID5).toBeNull();

  // Change user email
  let user = await dbm.userService.getUser(userID);
  expect(user.email).toBe(email);
  let success = await dbm.emailChangeService.changeEmail(emailChangeID2);
  expect(success).toBeTruthy();
  emailChangeRecord = await dbm.emailChangeService.getEmailChangeRecord(
    emailChangeID2
  );
  expect(emailChangeRecord).toBeUndefined();
  emailExists = await dbm.emailChangeService.emailChangeRecordExists(
    emailChangeID2
  );
  expect(emailExists).toBeFalsy();
  user = await dbm.userService.getUser(userID);
  expect(user.email).toBe(newEmail);

  // Change user email with invalid record ID
  user = await dbm.userService.getUser(userID);
  expect(user.email).toBe(newEmail);
  success = await dbm.emailChangeService.changeEmail("!!!!");
  expect(success).toBeFalsy();
  user = await dbm.userService.getUser(userID);
  expect(user.email).toBe(newEmail);

  // Delete email change record
  const emailChangeID6 = await dbm.emailChangeService.createEmailChangeRecord(
    userID,
    newEmail,
    false
  );
  emailExists = await dbm.emailChangeService.emailChangeRecordExists(
    emailChangeID6
  );
  expect(emailExists).toBeTruthy();
  await dbm.emailChangeService.deleteEmailChangeRecord(emailChangeID6);
  emailExists = await dbm.emailChangeService.emailChangeRecordExists(
    emailChangeID6
  );
  expect(emailExists).toBeFalsy();

  // Delete email change record by user ID
  const emailChangeID7 = await dbm.emailChangeService.createEmailChangeRecord(
    userID,
    newEmail,
    false
  );
  emailExists = await dbm.emailChangeService.emailChangeRecordExists(
    emailChangeID7
  );
  expect(emailExists).toBeTruthy();
  await dbm.emailChangeService.deleteEmailChangeRecordByUserID(userID);
  emailExists = await dbm.emailChangeService.emailChangeRecordExists(
    emailChangeID7
  );
  expect(emailExists).toBeFalsy();

  await dbm.userService.deleteUser(userID);

  await closeDBM(dbm);
});
