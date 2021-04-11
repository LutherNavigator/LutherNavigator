import { getDBM, closeDBM, getByID } from "./util";
import { getTime } from "../../src/services/util";
import { LoginStatus } from "../../src/services/user";

// Test suspended service
test("Suspended", async () => {
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
  await dbm.userService.setApproved(userID);

  // Check user can log in
  let loginStatus = await dbm.userService.login(email, password);
  expect(loginStatus).toBe(LoginStatus.Success);
  let suspended = await dbm.suspendedService.userIsSuspended(userID);
  expect(suspended).toBe(false);

  // Suspend account
  const suspensionID = await dbm.suspendedService.suspendUser(
    userID,
    getTime(),
    false
  );
  loginStatus = await dbm.userService.login(email, password);
  expect(loginStatus).toBe(LoginStatus.AccountSuspended);

  // Check suspension exists
  let exists = await dbm.suspendedService.suspensionExists(suspensionID);
  expect(exists).toBe(true);

  // Try to suspend the same account twice
  const suspensionID2 = await dbm.suspendedService.suspendUser(
    userID,
    getTime(),
    false
  );
  expect(suspensionID2).toBeNull();

  // Get suspension
  const suspension = await dbm.suspendedService.getSuspension(suspensionID);
  expect(suspension.id).toBe(suspensionID);
  expect(suspension.userID).toBe(userID);
  expect(getTime() - suspension.suspendedUntil).toBeLessThanOrEqual(3);

  // Check user is suspended
  suspended = await dbm.suspendedService.userIsSuspended(userID);
  expect(suspended).toBe(true);

  // Get all suspended users
  const suspendedUsers = await dbm.suspendedService.suspendedUsers();
  expect(suspendedUsers.length).toBeGreaterThanOrEqual(1);
  const user = getByID(suspendedUsers, userID);
  expect(user.id).toBe(userID);

  // Delete suspension
  await dbm.suspendedService.deleteSuspension(suspensionID);
  exists = await dbm.suspendedService.suspensionExists(suspensionID);
  expect(exists).toBe(false);
  suspended = await dbm.suspendedService.userIsSuspended(userID);
  expect(suspended).toBe(false);

  await dbm.userService.deleteUser(userID);

  await closeDBM(dbm);
});
