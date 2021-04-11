import { getDBM, closeDBM, wait } from "./util";
import { getTime } from "../../src/services/util";
import * as crypto from "crypto";

// Test admin favorites service
test("AdminFavorites", async () => {
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

  const content = "Post content";
  const location = "Post location";
  const city = "Decorah, IA";
  const country = "USA";
  const locationTypeID = 6; // Restaurant
  const programID = 1;
  const threeWords = "Three word description";
  const generalRating = 5;
  const rating = { general: generalRating };
  const len = Math.floor(Math.random() * 63) + 1;
  const buf = crypto.randomBytes(len);
  const postID1 = await dbm.postService.createPost(
    userID,
    content + " 1",
    [],
    location + " 1",
    city,
    country,
    locationTypeID,
    programID,
    rating,
    threeWords
  );
  await dbm.postService.setPostImages(postID1, [buf]);
  await wait(1000);
  const postID2 = await dbm.postService.createPost(
    userID,
    content + " 2",
    [],
    location + " 2",
    city,
    country,
    locationTypeID,
    programID,
    rating,
    threeWords
  );
  await dbm.postService.setPostImages(postID2, [buf]);

  // Check that the posts are not yet favorited
  let favorited = await dbm.adminFavoritesService.isFavorite(postID1);
  expect(favorited).toBeFalsy();
  favorited = await dbm.adminFavoritesService.isFavorite(postID2);
  expect(favorited).toBeFalsy();

  // Favorite a post
  const favoriteID1 = await dbm.adminFavoritesService.favorite(postID1);
  await wait(1000);
  const favoriteID2 = await dbm.adminFavoritesService.favorite(postID2);

  // Check posts are favorited
  favorited = await dbm.adminFavoritesService.isFavorite(postID1);
  expect(favorited).toBeTruthy();
  favorited = await dbm.adminFavoritesService.isFavorite(postID2);
  expect(favorited).toBeTruthy();

  // Get favorite records by favorite ID
  let favorite1 = await dbm.adminFavoritesService.getFavorite(favoriteID1);
  expect(favorite1).not.toBeUndefined();
  expect(favorite1.id).toBe(favoriteID1);
  expect(favorite1.postID).toBe(postID1);
  expect(getTime() - favorite1.createTime).toBeLessThanOrEqual(5);
  let favorite2 = await dbm.adminFavoritesService.getFavorite(favoriteID2);
  expect(favorite2).not.toBeUndefined();
  expect(favorite2.id).toBe(favoriteID2);
  expect(favorite2.postID).toBe(postID2);
  expect(getTime() - favorite2.createTime).toBeLessThanOrEqual(5);

  // Get favorite records by post ID
  favorite1 = await dbm.adminFavoritesService.getFavoriteByPostID(postID1);
  expect(favorite1).not.toBeUndefined();
  expect(favorite1.id).toBe(favoriteID1);
  expect(favorite1.postID).toBe(postID1);
  expect(getTime() - favorite1.createTime).toBeLessThanOrEqual(5);
  favorite2 = await dbm.adminFavoritesService.getFavoriteByPostID(postID2);
  expect(favorite2).not.toBeUndefined();
  expect(favorite2.id).toBe(favoriteID2);
  expect(favorite2.postID).toBe(postID2);
  expect(getTime() - favorite2.createTime).toBeLessThanOrEqual(5);

  // Get all favorites
  let favorites = await dbm.adminFavoritesService.getFavorites();
  favorite1 = favorites[favorites.length - 2];
  expect(favorite1.id).toBe(favoriteID1);
  favorite2 = favorites[favorites.length - 1];
  expect(favorite2.id).toBe(favoriteID2);

  // Try to favorite an already favorited post
  const numFavorites = favorites.length;
  const favoriteID3 = await dbm.adminFavoritesService.favorite(postID1);
  expect(favoriteID3).toBeNull();
  favorites = await dbm.adminFavoritesService.getFavorites();
  expect(favorites.length).toBe(numFavorites);

  // Get all favorites as posts
  const favoritePosts = await dbm.adminFavoritesService.getFavoritePosts();
  const favoritePost1 = favoritePosts[favorites.length - 2];
  expect(favoritePost1.id).toBe(postID1);
  const favoritePost2 = favoritePosts[favorites.length - 1];
  expect(favoritePost2.id).toBe(postID2);

  // Get recent favorites
  let recentFavorites = await dbm.adminFavoritesService.getRecentFavorites(2);
  expect(recentFavorites.length).toBe(2);
  expect(recentFavorites[0].id).toBe(postID2);
  expect(recentFavorites[1].id).toBe(postID1);
  recentFavorites = await dbm.adminFavoritesService.getRecentFavorites(1);
  expect(recentFavorites.length).toBe(1);
  expect(recentFavorites[0].id).toBe(postID2);

  // Unfavorite posts
  await dbm.adminFavoritesService.unfavorite(postID1);
  await dbm.adminFavoritesService.unfavorite(postID2);
  favorited = await dbm.adminFavoritesService.isFavorite(postID1);
  expect(favorited).toBeFalsy();
  favorited = await dbm.adminFavoritesService.isFavorite(postID2);
  expect(favorited).toBeFalsy();

  await dbm.postService.deletePost(postID1);
  await dbm.postService.deletePost(postID2);

  await closeDBM(dbm);
});
