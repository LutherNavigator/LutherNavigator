import { getDBM, closeDBM, wait } from "./util";
import { getTime, checkPassword } from "../../src/services/util";

// Test session service
test("Session", async () => {
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

  // Create session
  const sessionID = await dbm.sessionService.createSession(userID, false);
  expect(sessionID.length).toBe(16);

  // Check session exists
  let sessionExists = await dbm.sessionService.sessionExists(sessionID);
  expect(sessionExists).toBe(true);

  // Get session
  let session = await dbm.sessionService.getSession(sessionID);
  expect(session.id).toBe(sessionID);
  expect(session.userID).toBe(userID);
  expect(session.createTime - getTime()).toBeLessThanOrEqual(3);
  expect(session.updateTime - getTime()).toBeLessThanOrEqual(3);

  // Get userID by sessionID
  let sessionUserID = await dbm.sessionService.getUserIDBySessionID(sessionID);
  expect(sessionUserID).toBe(userID);

  // Get userID by sessionID for invalid sessionID
  sessionUserID = await dbm.sessionService.getUserIDBySessionID(
    "!!!!!!!!!!!!!!!!"
  );
  expect(sessionUserID).toBeUndefined();

  // Get user by sessionID
  const sessionUser = await dbm.sessionService.getUserBySessionID(sessionID);
  expect(sessionUser.id).toBe(userID);
  expect(sessionUser.firstname).toBe(firstname);
  expect(sessionUser.lastname).toBe(lastname);
  expect(sessionUser.email).toBe(email);
  expect(sessionUser.statusID).toBe(statusID);
  const samePasswords = await checkPassword(password, sessionUser.password);
  expect(samePasswords).toBe(true);

  // Update session
  const previousUpdateTime = session.updateTime;
  await wait(1000);
  await dbm.sessionService.updateSession(sessionID, false);
  session = await dbm.sessionService.getSession(sessionID);
  expect(session.updateTime).toBeGreaterThan(previousUpdateTime);
  expect(session.updateTime - getTime()).toBeLessThanOrEqual(3);

  // Get all sessions
  await wait(1000);
  const sessionID2 = await dbm.sessionService.createSession(userID, false);
  let sessions = await dbm.sessionService.getUserSessions(userID);
  expect(sessions.length).toBe(2);
  expect(sessions[0].id).toBe(sessionID);
  expect(sessions[1].id).toBe(sessionID2);

  // Delete all sessions
  await dbm.sessionService.deleteUserSessions(userID);
  sessions = await dbm.sessionService.getUserSessions(userID);
  expect(sessions.length).toBe(0);
  sessionExists = await dbm.sessionService.sessionExists(sessionID);
  expect(sessionExists).toBe(false);
  sessionExists = await dbm.sessionService.sessionExists(sessionID2);
  expect(sessionExists).toBe(false);

  // Delete session
  const sessionID3 = await dbm.sessionService.createSession(userID, false);
  sessionExists = await dbm.sessionService.sessionExists(sessionID3);
  expect(sessionExists).toBe(true);
  await dbm.sessionService.deleteSession(sessionID3);

  // Check session is gone
  sessionExists = await dbm.sessionService.sessionExists(sessionID3);
  expect(sessionExists).toBe(false);

  await dbm.userService.deleteUser(userID);

  await closeDBM(dbm);
});
