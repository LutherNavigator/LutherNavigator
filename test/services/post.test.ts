import { getDBM, closeDBM, wait } from "./util";
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
  const locationTypeID = 6; // Restaurant
  const program = "N/A";
  const threeWords = "Absolutely amazing pizza";

  const len = Math.floor(Math.random() * 63) + 1;
  const buf = crypto.randomBytes(len);

  const rating = {
    general: 1,
    cost: 3,
    safety: 7,
  };

  // Create post
  let lastPostTime = (await dbm.userService.getUser(userID)).lastPostTime;
  expect(lastPostTime).toBeNull();
  const postID = await dbm.postService.createPost(
    userID,
    content,
    [buf],
    location,
    locationTypeID,
    program,
    rating,
    threeWords
  );
  expect(postID.length).toBe(4);
  lastPostTime = (await dbm.userService.getUser(userID)).lastPostTime;
  expect(lastPostTime - getTime()).toBeLessThanOrEqual(3);

  // Check post exists
  let postExists = await dbm.postService.postExists(postID);
  expect(postExists).toBe(true);

  // Get post
  const post = await dbm.postService.getPost(postID);
  expect(post.id).toBe(postID);
  expect(post.userID).toBe(userID);
  expect(post.content).toBe(content);
  expect(post.location).toBe(location);
  expect(post.locationTypeID).toBe(locationTypeID);
  expect(post.program).toBe(program);
  expect(post.threeWords).toBe(threeWords);
  expect(post.approved).toBeFalsy();
  expect(post.createTime - getTime()).toBeLessThanOrEqual(3);
  expect(post.editTime).toBeNull();

  // Get unapproved posts
  let unapproved = await dbm.postService.getUnapproved();
  expect(unapproved.length).toBe(1);
  expect(unapproved[0]["postID"]).toBe(postID);
  expect(unapproved[0]["firstname"]).toBe(firstname);
  expect(unapproved[0]["lastname"]).toBe(lastname);
  expect(unapproved[0].content).toBe(content);
  expect(unapproved[0].location).toBe(location);
  expect(unapproved[0]["locationType"]).toBe("Restaurant");
  expect(unapproved[0].program).toBe(program);
  expect(unapproved[0].threeWords).toBe(threeWords);
  expect(unapproved[0].createTime - getTime()).toBeLessThanOrEqual(3);

  // Get post user
  const postUser = await dbm.postService.getPostUser(postID);
  const user = await dbm.userService.getUser(userID);
  expect(postUser).toMatchObject(user);

  // Get post rating
  const postRating = await dbm.postService.getPostRating(postID);
  expect(postRating).toMatchObject(rating);

  // Get post content
  const postContent = await dbm.postService.getPostContent(postID);
  expect(postContent).toBe(content);

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

  // Set approved
  await dbm.postService.setApproved(postID);
  approved = await dbm.postService.isApproved(postID);
  expect(approved).toBe(true);
  unapproved = await dbm.postService.getUnapproved();
  expect(unapproved.length).toBe(0);

  // Get all user posts
  const postID2 = await dbm.postService.createPost(
    userID,
    content,
    [buf],
    location,
    locationTypeID,
    program,
    rating,
    threeWords
  );
  let posts = await dbm.postService.getUserPosts(userID);
  expect(posts.length).toBe(2);
  expect(posts[0].id).toBe(postID);
  expect(posts[1].id).toBe(postID2);

  // Delete all user posts
  await dbm.postService.deleteUserPosts(userID);
  posts = await dbm.postService.getUserPosts(userID);
  expect(posts.length).toBe(0);
  postExists = await dbm.postService.postExists(postID);
  expect(postExists).toBe(false);
  postExists = await dbm.postService.postExists(postID2);
  expect(postExists).toBe(false);

  // Delete post
  await wait(1000);
  const postID3 = await dbm.postService.createPost(
    userID,
    content,
    [buf],
    location,
    locationTypeID,
    program,
    rating,
    threeWords
  );
  postExists = await dbm.postService.postExists(postID3);
  expect(postExists).toBe(true);
  await dbm.postService.deletePost(postID3);

  // Check post is gone
  postExists = await dbm.postService.postExists(postID3);
  expect(postExists).toBe(false);

  await dbm.userService.deleteUser(userID);

  await closeDBM(dbm);
});
