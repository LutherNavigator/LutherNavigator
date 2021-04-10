import { getDBM, closeDBM } from "./util";
import * as crypto from "crypto";

test("PostImage", async () => {
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
  const programID = 1;
  const threeWords = "Absolutely amazing pizza";

  const rating = {
    general: 1,
    cost: 3,
    safety: 5,
  };

  // Create post
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

  // Check no post images exist
  let postImages = await dbm.postImageService.getPostImages(postID);
  expect(postImages.length).toBe(0);
  let numImages = await dbm.postImageService.numImages(postID);
  expect(numImages).toBe(0);

  // Check set post image
  const len = Math.floor(Math.random() * 63) + 1;
  const buf = crypto.randomBytes(len);
  const imageID = await dbm.imageService.createImage(buf);
  await dbm.postImageService.setPostImage(postID, imageID);
  postImages = await dbm.postImageService.getPostImages(postID);
  expect(postImages.length).toBe(1);
  expect(postImages[0].data.toString()).toBe(buf.toString());
  numImages = await dbm.postImageService.numImages(postID);
  expect(numImages).toBe(1);

  // Create post image
  const len2 = Math.floor(Math.random() * 63) + 1;
  const buf2 = crypto.randomBytes(len2);
  const imageID2 = await dbm.postImageService.createPostImage(postID, buf2);
  postImages = await dbm.postImageService.getPostImages(postID);
  expect(postImages.length).toBe(2);
  expect(postImages[1].id).toBe(imageID2);
  expect(postImages[1].data.toString()).toBe(buf2.toString());
  numImages = await dbm.postImageService.numImages(postID);
  expect(numImages).toBe(2);

  // Create post images
  const len3 = Math.floor(Math.random() * 63) + 1;
  const buf3 = crypto.randomBytes(len3);
  const len4 = Math.floor(Math.random() * 63) + 1;
  const buf4 = crypto.randomBytes(len4);
  const [
    imageID3,
    imageID4,
  ] = await dbm.postImageService.createPostImages(postID, [buf3, buf4]);
  postImages = await dbm.postImageService.getPostImages(postID);
  expect(postImages.length).toBe(4);
  expect(postImages[2].id).toBe(imageID3);
  expect(postImages[2].data.toString()).toBe(buf3.toString());
  expect(postImages[3].id).toBe(imageID4);
  expect(postImages[3].data.toString()).toBe(buf4.toString());
  numImages = await dbm.postImageService.numImages(postID);
  expect(numImages).toBe(4);

  // Delete all post images
  await dbm.postImageService.deletePostImages(postID);
  postImages = await dbm.postImageService.getPostImages(postID);
  expect(postImages.length).toBe(0);
  numImages = await dbm.postImageService.numImages(postID);
  expect(numImages).toBe(0);

  // Delete images upon post deletion
  const len5 = Math.floor(Math.random() * 63) + 1;
  const buf5 = crypto.randomBytes(len5);
  const imageID5 = await dbm.postImageService.createPostImage(postID, buf5);
  numImages = await dbm.postImageService.numImages(postID);
  expect(numImages).toBe(1);
  let imageExists = await dbm.imageService.imageExists(imageID5);
  expect(imageExists).toBe(true);
  await dbm.postService.deletePost(postID);
  numImages = await dbm.postImageService.numImages(postID);
  expect(numImages).toBe(0);
  imageExists = await dbm.imageService.imageExists(imageID5);
  expect(imageExists).toBe(false);

  await dbm.userService.deleteUser(userID);

  await closeDBM(dbm);
});
