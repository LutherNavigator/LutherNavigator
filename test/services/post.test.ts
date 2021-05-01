import { getDBM, closeDBM, wait, getByProp } from "./util";
import * as crypto from "crypto";
import { getTime } from "../../src/services/util";

// Test post service
test("Post", async () => {
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

  const content = "Hello, post!";
  const location = "Mabe's Pizza";
  const city = "Decorah, IA";
  const country = "USA";
  const locationTypeID = 6; // Restaurant
  const programID = 1;
  const programName = await dbm.programService.getProgramName(programID);
  const threeWords = "Absolutely amazing pizza";

  const len = Math.floor(Math.random() * 63) + 1;
  const buf = crypto.randomBytes(len);

  const rating = {
    general: 1,
    cost: 3,
    safety: 5,
  };

  const address = "111 W. Water St, Decorah, IA";
  const phone = "5632222225";
  const website = "https://mabespizza.com/";

  // Create post
  let lastPostTime = (await dbm.userService.getUser(userID)).lastPostTime;
  expect(lastPostTime).toBeNull();
  const postID = await dbm.postService.createPost(
    userID,
    content,
    [buf],
    location,
    city,
    country,
    locationTypeID,
    programID,
    rating,
    threeWords,
    address,
    phone,
    website
  );
  expect(postID.length).toBe(4);
  lastPostTime = (await dbm.userService.getUser(userID)).lastPostTime;
  expect(getTime() - lastPostTime).toBeLessThanOrEqual(3);

  // Check post exists
  let postExists = await dbm.postService.postExists(postID);
  expect(postExists).toBe(true);

  // Get post
  let post = await dbm.postService.getPost(postID);
  expect(post.id).toBe(postID);
  expect(post.userID).toBe(userID);
  expect(post.content).toBe(content);
  expect(post.location).toBe(location);
  expect(post.city).toBe(city);
  expect(post.country).toBe(country);
  expect(post.locationTypeID).toBe(locationTypeID);
  expect(post.programID).toBe(programID);
  expect(post.threeWords).toBe(threeWords);
  expect(post.currentUserStatusID).toBe(statusID);
  expect(post.address).toBe(address);
  expect(post.phone).toBe(phone);
  expect(post.website).toBe(website);
  expect(post.approved).toBeFalsy();
  expect(getTime() - post.createTime).toBeLessThanOrEqual(3);
  expect(post.editTime).toBeNull();

  // Get unapproved posts
  let unapprovedPosts = await dbm.postService.getUnapproved();
  expect(unapprovedPosts.length).toBeGreaterThanOrEqual(1);
  const unapproved = getByProp(unapprovedPosts, "postID", postID);
  expect(unapproved.postID).toBe(postID);
  expect(unapproved.firstname).toBe(firstname);
  expect(unapproved.lastname).toBe(lastname);
  expect(unapproved.content).toBe(content);
  expect(unapproved.location).toBe(location);
  expect(unapproved.city).toBe(city);
  expect(unapproved.country).toBe(country);
  expect(unapproved.locationType).toBe("Restaurant");
  expect(unapproved.program).toBe(programName);
  expect(unapproved.threeWords).toBe(threeWords);
  expect(getTime() - unapproved.createTime).toBeLessThanOrEqual(3);

  // Get post user
  let postUser = await dbm.postService.getPostUser(postID);
  const user = await dbm.userService.getUser(userID);
  expect(postUser).toEqual(user);
  expect(postUser.id).toBe(user.id);

  // Get post user for invalid post
  postUser = await dbm.postService.getPostUser("!!!!");
  expect(postUser).toBeUndefined();

  // Get post rating
  let postRating = await dbm.postService.getPostRating(postID);
  expect(postRating).toEqual({
    id: post.ratingID,
    general: rating.general,
    cost: rating.cost,
    quality: null,
    safety: rating.safety,
    cleanliness: null,
    guestServices: null,
  });

  // Get post rating for invalid post
  postRating = await dbm.postService.getPostRating("!!!!");
  expect(postRating).toBeUndefined();

  // Get post content
  let postContent = await dbm.postService.getPostContent(postID);
  expect(postContent).toBe(content);

  // Get post content for invalid post
  postContent = await dbm.postService.getPostContent("!!!!");
  expect(postContent).toBeUndefined();

  // Set post content
  const newContent = "Goodbye, post!";
  await dbm.postService.setPostContent(postID, newContent);
  const newPostContent = await dbm.postService.getPostContent(postID);
  expect(newPostContent).toBe(newContent);

  // Get post images
  const postImages = await dbm.postService.getPostImages(postID);
  expect(postImages.length).toBe(1);
  expect(postImages[0].data.toString()).toBe(buf.toString());

  // Set post image
  const newLen = Math.floor(Math.random() * 63) + 1;
  const newBuf = crypto.randomBytes(newLen);
  await dbm.postService.setPostImages(postID, [newBuf]);
  const newPostImages = await dbm.postService.getPostImages(postID);
  expect(newPostImages.length).toBe(2);
  expect(newPostImages[1].data.toString()).toBe(newBuf.toString());

  // Check approved
  let approved = await dbm.postService.isApproved(postID);
  expect(approved).toBe(false);

  // Check approved for invalid post
  approved = await dbm.postService.isApproved("!!!!");
  expect(approved).toBe(false);

  // Set approved
  await dbm.postService.setApproved(postID);
  approved = await dbm.postService.isApproved(postID);
  expect(approved).toBe(true);
  unapprovedPosts = await dbm.postService.getUnapproved();
  expect(unapprovedPosts.length).toBeGreaterThanOrEqual(0);

  // Set unapproved
  await dbm.postService.setApproved(postID, false);
  approved = await dbm.postService.isApproved(postID);
  expect(approved).toBe(false);
  await dbm.postService.setApproved(postID);

  // Get all user posts
  const postID2 = await dbm.postService.createPost(
    userID,
    content,
    [buf],
    location,
    city,
    country,
    locationTypeID,
    programID,
    rating,
    threeWords
  );
  let posts = await dbm.postService.getUserPosts(userID);
  expect(posts.length).toBe(2);
  expect(posts[0].id === postID || posts[0].id === postID2).toBeTruthy();
  expect(posts[1].id === postID || posts[1].id === postID2).toBeTruthy();
  expect(posts[0].id).not.toBe(posts[1].id);

  // Delete all user posts
  await dbm.postService.deleteUserPosts(userID);
  posts = await dbm.postService.getUserPosts(userID);
  expect(posts.length).toBe(0);
  postExists = await dbm.postService.postExists(postID);
  expect(postExists).toBe(false);
  postExists = await dbm.postService.postExists(postID2);
  expect(postExists).toBe(false);

  // Edit post
  await wait(1000);
  const postID3 = await dbm.postService.createPost(
    userID,
    content,
    [buf],
    location,
    city,
    country,
    locationTypeID,
    programID,
    rating,
    threeWords
  );
  const newCity = "Minneapolis, MN";
  await dbm.postService.editPost(postID3, {
    content: newContent,
    city: newCity,
  });
  post = await dbm.postService.getPost(postID3);
  expect(post.id).toBe(postID3);
  expect(post.userID).toBe(userID);
  expect(post.content).toBe(newContent);
  expect(post.location).toBe(location);
  expect(post.city).toBe(newCity);
  expect(post.country).toBe(country);
  expect(post.locationTypeID).toBe(locationTypeID);
  expect(post.programID).toBe(programID);
  expect(post.threeWords).toBe(threeWords);
  expect(post.currentUserStatusID).toBe(statusID);
  expect(post.address).toBeNull();
  expect(post.phone).toBeNull();
  expect(post.website).toBeNull();
  expect(post.approved).toBeFalsy();
  expect(getTime() - post.createTime).toBeLessThanOrEqual(5);
  expect(post.editTime).not.toBeNull();
  expect(getTime() - post.editTime).toBeLessThanOrEqual(3);

  // Delete post
  postExists = await dbm.postService.postExists(postID3);
  expect(postExists).toBe(true);
  await dbm.postService.deletePost(postID3);

  // Check post is gone
  postExists = await dbm.postService.postExists(postID3);
  expect(postExists).toBe(false);

  // Try to delete nonexistant post
  await dbm.postService.deletePost(postID3);
  postExists = await dbm.postService.postExists(postID3);
  expect(postExists).toBe(false);

  await dbm.userService.deleteUser(userID);

  await closeDBM(dbm);
});
