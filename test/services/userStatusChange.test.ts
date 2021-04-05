import { getDBM, closeDBM, getByID, getByProp } from "./util";
import { getTime } from "../../src/services/util";
import * as crypto from "crypto";

// Test user status service
test("UserStatusChange", async () => {
  const dbm = await getDBM();

  const firstname = "Martin";
  const lastname = "Luther";
  const email = "lumart01@luther.edu";
  const password = "password123";
  const statusID = 1; // Student
  const newStatusID = 2; // Alum
  const newStatusID2 = 3; // Faculty/Staff

  const userID = await dbm.userService.createUser(
    firstname,
    lastname,
    email,
    password,
    statusID
  );
  await dbm.userService.setVerified(userID);

  // Request a status change
  let requestID = await dbm.userStatusChangeService.createStatusChangeRequest(
    userID,
    newStatusID
  );
  expect(requestID.length).toBe(4);

  // Check request exists
  let exists = await dbm.userStatusChangeService.statusChangeRequestExists(
    requestID
  );
  expect(exists).toBe(true);

  // Get status change request
  let request = await dbm.userStatusChangeService.getStatusChangeRequest(
    requestID
  );
  expect(request.id).toBe(requestID);
  expect(request.userID).toBe(userID);
  expect(request.newStatusID).toBe(newStatusID);
  expect(request.createTime - getTime()).toBeLessThanOrEqual(3);

  // Change status change request
  let requestID2 = await dbm.userStatusChangeService.createStatusChangeRequest(
    userID,
    newStatusID2
  );
  expect(requestID2.length).toBe(4);
  expect(requestID2).toBe(requestID);
  request = await dbm.userStatusChangeService.getStatusChangeRequest(
    requestID2
  );
  expect(request.newStatusID).toBe(newStatusID2);

  // Delete the request
  await dbm.userStatusChangeService.deleteStatusChangeRequest(requestID);
  exists = await dbm.userStatusChangeService.statusChangeRequestExists(
    requestID
  );
  expect(exists).toBe(false);
  request = await dbm.userStatusChangeService.getStatusChangeRequest(requestID);
  expect(request).toBe(undefined);

  // Get all requests
  requestID = await dbm.userStatusChangeService.createStatusChangeRequest(
    userID,
    newStatusID
  );
  const requests = await dbm.userStatusChangeService.getStatusChangeRequests();
  expect(requests.length).toBeGreaterThanOrEqual(1);
  request = getByID(requests, requestID);
  expect(request.id).toBe(requestID);
  expect(request.userID).toBe(userID);
  expect(request.newStatusID).toBe(newStatusID);
  expect(request.createTime - getTime()).toBeLessThanOrEqual(3);

  // Get user requests
  const userRequests = await dbm.userStatusChangeService.getUserRequests();
  expect(userRequests.length).toBeGreaterThanOrEqual(1);
  const userRequest = getByProp(userRequests, "requestID", requestID);
  expect(userRequest["userID"]).toBe(userID);
  expect(userRequest.firstname).toBe(firstname);
  expect(userRequest.lastname).toBe(lastname);
  expect(userRequest.email).toBe(email);
  expect(userRequest["status"]).toBe("Student");
  expect(userRequest["newStatus"]).toBe("Alum");
  expect(userRequest["requestID"]).toBe(requestID);

  // Create new post
  const content = "QUERY POST CONTENT";
  const location = "QUERY POST LOCATION";
  const locationTypeID = 6; // Restaurant
  const programID = 1;
  const threeWords = "Three word description";
  const generalRating = 5;
  const rating = { general: generalRating };
  const len = Math.floor(Math.random() * 63) + 1;
  const buf = crypto.randomBytes(len);
  const postID = await dbm.postService.createPost(
    userID,
    content,
    [],
    location,
    locationTypeID,
    programID,
    rating,
    threeWords
  );
  await dbm.postService.setPostImages(postID, [buf]);
  let post = await dbm.postService.getPost(postID);
  expect(post.currentUserStatusID).toBe(statusID);

  // Approve request
  let user = await dbm.userService.getUser(userID);
  expect(user.statusID).toBe(statusID);
  await dbm.userStatusChangeService.approveStatusChangeRequest(requestID);
  exists = await dbm.userStatusChangeService.statusChangeRequestExists(
    requestID
  );
  expect(exists).toBe(false);
  user = await dbm.userService.getUser(userID);
  expect(user.statusID).toBe(newStatusID);

  // Check post status ID
  post = await dbm.postService.getPost(postID);
  expect(post.currentUserStatusID).toBe(statusID);
  await dbm.postService.deletePost(postID);

  // Deny request
  requestID = await dbm.userStatusChangeService.createStatusChangeRequest(
    userID,
    statusID
  );
  user = await dbm.userService.getUser(userID);
  expect(user.statusID).toBe(newStatusID);
  await dbm.userStatusChangeService.denyStatusChangeRequest(requestID);
  exists = await dbm.userStatusChangeService.statusChangeRequestExists(
    requestID
  );
  expect(exists).toBe(false);
  user = await dbm.userService.getUser(userID);
  expect(user.statusID).toBe(newStatusID);

  await dbm.userService.deleteUser(userID);

  await closeDBM(dbm);
});
