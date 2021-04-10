import { getDBM, closeDBM, getByID } from "./util";
import * as crypto from "crypto";

// Test query functions
test("Query", async () => {
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

  const content = "QUERY POST CONTENT";
  const location = "QUERY POST LOCATION";
  const city = "Decorah, IA";
  const country = "USA";
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
    city,
    country,
    locationTypeID,
    programID,
    rating,
    threeWords
  );
  await dbm.postService.setPostImages(postID, [buf]);

  // Query before approved
  let results = await dbm.queryService.query("Content");
  let result = getByID(results, postID);
  expect(result).toBeUndefined();
  await dbm.postService.setApproved(postID);

  // Query by content
  results = await dbm.queryService.query("Content");
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Query by location
  results = await dbm.queryService.query("Location");
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Query by program
  results = await dbm.queryService.query("j-term");
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query by search string
  results = await dbm.queryService.advancedQuery(
    { search: "Content" },
    "program"
  );
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query by program
  results = await dbm.queryService.advancedQuery(
    { programIDs: [programID] },
    "program"
  );
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query by location type
  results = await dbm.queryService.advancedQuery(
    { locationTypeIDs: [locationTypeID] },
    "program"
  );
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query by user status
  results = await dbm.queryService.advancedQuery(
    { statusIDs: [statusID] },
    "program"
  );
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query by rating
  results = await dbm.queryService.advancedQuery(
    { ratings: [generalRating] },
    "program"
  );
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query sort by program
  results = await dbm.queryService.advancedQuery({}, "program");
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query sort by location type
  results = await dbm.queryService.advancedQuery({}, "locationType");
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query sort by user status
  results = await dbm.queryService.advancedQuery({}, "userStatus");
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query sort by rating
  results = await dbm.queryService.advancedQuery({}, "rating");
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query sort by timestamp
  results = await dbm.queryService.advancedQuery({}, "timestamp");
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);

  // Advanced query sort by rating descending
  results = await dbm.queryService.advancedQuery({}, "rating", false);
  expect(results.length).toBeGreaterThan(0);
  result = getByID(results, postID);
  expect(result?.id).toBe(postID);
  expect(result.rating).toBe(generalRating);
  let lastRating = 5;
  for (const res of results) {
    expect(res.rating).toBeLessThanOrEqual(lastRating);
    lastRating = res.rating;
  }

  // Advanced query with empty list
  results = await dbm.queryService.advancedQuery({ programIDs: [] }, "program");
  expect(results.length).toBeGreaterThan(0);

  await dbm.postService.deletePost(postID);
  await dbm.userService.deleteUser(userID);

  await closeDBM(dbm);
});
