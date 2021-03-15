import { getDBM, closeDBM } from "./util";
import * as crypto from "crypto";
import { getTime, checkPassword } from "../../src/services/util";
import { LoginStatus } from "../../src/services/user";

// Test user service
test("User", async () => {
  const dbm = await getDBM();

  const firstname = "Martin";
  const lastname = "Luther";
  const email = "lumart01@luther.edu";
  const password = "password123";
  const statusID = 1; // Student

  // Make sure the email address is unique
  let uniqueEmail = await dbm.userService.uniqueEmail(email);
  expect(uniqueEmail).toBe(true);

  // Create user
  const userID = await dbm.userService.createUser(
    firstname,
    lastname,
    email,
    password,
    statusID
  );
  expect(userID.length).toBe(4);

  // Check user exists
  let userExists = await dbm.userService.userExists(userID);
  expect(userExists).toBe(true);

  // Check the email has now been registered
  uniqueEmail = await dbm.userService.uniqueEmail(email);
  expect(uniqueEmail).toBe(false);

  // Get user
  let user = await dbm.userService.getUser(userID);
  expect(user.id).toBe(userID);
  expect(user.firstname).toBe(firstname);
  expect(user.lastname).toBe(lastname);
  expect(user.email).toBe(email);
  expect(user.statusID).toBe(statusID);
  expect(user.verified).toBeFalsy();
  expect(user.approved).toBeFalsy();
  expect(user.admin).toBeFalsy();
  expect(user.imageID).toBeNull();
  expect(user.joinTime - getTime()).toBeLessThanOrEqual(3);
  expect(user.lastLoginTime).toBeNull();
  expect(user.lastPostTime).toBeNull();

  // Get user by email
  user = await dbm.userService.getUserByEmail(email);
  expect(user.id).toBe(userID);
  expect(user.firstname).toBe(firstname);
  expect(user.lastname).toBe(lastname);
  expect(user.email).toBe(email);
  expect(user.statusID).toBe(statusID);
  expect(user.verified).toBeFalsy();
  expect(user.approved).toBeFalsy();
  expect(user.admin).toBeFalsy();
  expect(user.imageID).toBeNull();
  expect(user.joinTime - getTime()).toBeLessThanOrEqual(3);
  expect(user.lastLoginTime).toBeNull();
  expect(user.lastPostTime).toBeNull();

  // Check passwords match
  let same = await checkPassword(password, user.password);
  expect(same).toBe(true);

  // Get unapproved users
  let unapproved = await dbm.userService.getUnapproved();
  expect(unapproved.length).toBe(1);
  expect(unapproved[0]["userID"]).toBe(userID);
  expect(unapproved[0].firstname).toBe(firstname);
  expect(unapproved[0].lastname).toBe(lastname);
  expect(unapproved[0].email).toBe(email);
  expect(unapproved[0]["status"]).toBe("Student");
  expect(unapproved[0].joinTime - getTime()).toBeLessThanOrEqual(3);

  // Log user in
  await dbm.userService.setVerified(userID);
  await dbm.userService.setApproved(userID);
  let success = await dbm.userService.login(email, password);
  expect(success).toBe(LoginStatus.Success);
  unapproved = await dbm.userService.getUnapproved();
  expect(unapproved.length).toBe(0);

  // Check last login timestamp has changed
  user = await dbm.userService.getUser(userID);
  expect(user.lastLoginTime - getTime()).toBeLessThanOrEqual(3);

  // Attempt login with invalid email
  success = await dbm.userService.login(email + "a", password);
  expect(success).toBe(LoginStatus.BadLogin);

  // Attempt login with invalid password
  success = await dbm.userService.login(email, password + "a");
  expect(success).toBe(LoginStatus.BadLogin);

  // Get user status name
  const userStatusName = await dbm.userService.getUserStatusName(userID);
  const statusName = await dbm.userStatusService.getStatusName(statusID);
  expect(userStatusName).toBe(statusName);

  // Get null user image
  let userImage = await dbm.userService.getUserImage(userID);
  expect(userImage).toBe(undefined);

  // Set user image
  const len = Math.floor(Math.random() * 63) + 1;
  const buf = crypto.randomBytes(len);
  await dbm.userService.setUserImage(userID, buf);

  // Get new user image
  userImage = await dbm.userService.getUserImage(userID);
  user = await dbm.userService.getUser(userID);
  expect(userImage.id).toBe(user.imageID);
  expect(userImage.data.toString()).toBe(buf.toString());
  expect(userImage.registerTime - getTime()).toBeLessThanOrEqual(3);

  // Delete user image
  await dbm.userService.deleteUserImage(userID);
  userImage = await dbm.userService.getUserImage(userID);
  expect(userImage).toBe(undefined);

  // Check if user is verified
  await dbm.userService.setVerified(userID, false);
  let verified = await dbm.userService.isVerified(userID);
  expect(verified).toBe(false);

  // Set user to verified
  await dbm.userService.setVerified(userID);
  verified = await dbm.userService.isVerified(userID);
  expect(verified).toBe(true);

  // Check if user has been approved
  await dbm.userService.setApproved(userID, false);
  let approved = await dbm.userService.isApproved(userID);
  expect(approved).toBe(false);

  // Set user to approved
  await dbm.userService.setApproved(userID);
  approved = await dbm.userService.isApproved(userID);
  expect(approved).toBe(true);

  // Check if user is an admin
  let admin = await dbm.userService.isAdmin(userID);
  expect(admin).toBe(false);

  // Make user an admin
  await dbm.userService.setAdmin(userID);
  admin = await dbm.userService.isAdmin(userID);
  expect(admin).toBe(true);

  // Change password
  const newPassword = "password135";
  await dbm.userService.setUserPassword(userID, newPassword);
  user = await dbm.userService.getUser(userID);

  // Check new password matches
  same = await checkPassword(newPassword, user.password);
  expect(same).toBe(true);

  // Check old password does not match
  same = await checkPassword(password, user.password);
  expect(same).toBe(false);

  // Check login with new password
  success = await dbm.userService.login(email, newPassword);
  expect(success).toBe(LoginStatus.Success);

  // Check login with old password fails
  success = await dbm.userService.login(email, password);
  expect(success).toBe(LoginStatus.BadLogin);

  // Update post timestamp
  let lastPostTime = (await dbm.userService.getUser(userID)).lastPostTime;
  expect(lastPostTime).toBeNull();
  await dbm.userService.updateLastPostTime(userID);
  lastPostTime = (await dbm.userService.getUser(userID)).lastPostTime;
  expect(lastPostTime - getTime()).toBeLessThanOrEqual(3);

  // Delete user
  await dbm.userService.deleteUser(userID);

  // Check user is gone
  userExists = await dbm.userService.userExists(userID);
  expect(userExists).toBe(false);

  // Check the email is no longer registered
  uniqueEmail = await dbm.userService.uniqueEmail(email);
  expect(uniqueEmail).toBe(true);

  await closeDBM(dbm);
});
