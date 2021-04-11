import { getDBM, closeDBM, getByID } from "./util";
import { getTime } from "../../src/services/util";
import * as crypto from "crypto";

// Test post vote service
test("PostVote", async () => {
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
  const postID = await dbm.postService.createPost(
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
  await dbm.postService.setPostImages(postID, [buf]);

  const voteType = "Test vote type";

  // Check there are no votes on the post
  let postVotes = await dbm.postVoteService.getPostVotes(postID);
  expect(postVotes.length).toBe(0);

  // Check that the user has not voted
  let userVotes = await dbm.postVoteService.getUserVotes(userID);
  expect(userVotes.length).toBe(0);

  // Check if voted
  let voted = await dbm.postVoteService.voted(userID, postID);
  expect(voted).toBeFalsy();

  // Vote on a post
  await dbm.postVoteService.vote(userID, postID, voteType);
  postVotes = await dbm.postVoteService.getPostVotes(postID);
  expect(postVotes.length).toBe(1);
  userVotes = await dbm.postVoteService.getUserVotes(userID);
  expect(userVotes.length).toBe(1);
  voted = await dbm.postVoteService.voted(userID, postID);
  expect(voted).toBeTruthy();

  // Try to vote a second time
  await dbm.postVoteService.vote(userID, postID, voteType);
  postVotes = await dbm.postVoteService.getPostVotes(postID);
  expect(postVotes.length).toBe(1);
  userVotes = await dbm.postVoteService.getUserVotes(userID);
  expect(userVotes.length).toBe(1);
  voted = await dbm.postVoteService.voted(userID, postID);
  expect(voted).toBeTruthy();

  // Get vote
  const vote = await dbm.postVoteService.getVote(userID, postID);
  expect(vote).not.toBeUndefined();
  expect(vote.userID).toBe(userID);
  expect(vote.postID).toBe(postID);
  expect(vote.voteType).toBe(voteType);
  expect(getTime() - vote.createTime).toBeLessThanOrEqual(3);

  // Get vote type
  const thisVoteType = await dbm.postVoteService.getPostVoteType(
    userID,
    postID
  );
  expect(thisVoteType).toBe(voteType);

  // Get post vote count
  const otherVoteType = "Other test vote type";
  let numVotes = await dbm.postVoteService.getNumPostVotes(postID, voteType);
  expect(numVotes).toBe(1);
  numVotes = await dbm.postVoteService.getNumPostVotes(postID, otherVoteType);
  expect(numVotes).toBe(0);

  // Get all votes
  const votes = await dbm.postVoteService.getVotes();
  expect(votes.length).toBeGreaterThanOrEqual(1);
  const thisVote = getByID(votes, vote.id);
  expect(thisVote).not.toBeUndefined();
  expect(thisVote).not.toBeNull();
  expect(thisVote.id).toBe(vote.id);
  expect(thisVote.userID).toBe(vote.userID);
  expect(thisVote.postID).toBe(vote.postID);
  expect(thisVote.voteType).toBe(vote.voteType);
  expect(thisVote.createTime).toBe(vote.createTime);

  // Unvote
  await dbm.postVoteService.unvote(userID, postID);
  postVotes = await dbm.postVoteService.getPostVotes(postID);
  expect(postVotes.length).toBe(0);
  userVotes = await dbm.postVoteService.getUserVotes(userID);
  expect(userVotes.length).toBe(0);
  voted = await dbm.postVoteService.voted(userID, postID);
  expect(voted).toBeFalsy();

  // Delete user votes
  await dbm.postVoteService.vote(userID, postID, voteType);
  await dbm.postVoteService.deleteUserVotes(userID);
  userVotes = await dbm.postVoteService.getUserVotes(userID);
  expect(userVotes.length).toBe(0);

  // Delete post votes
  await dbm.postVoteService.vote(userID, postID, voteType);
  await dbm.postVoteService.deletePostVotes(postID);
  postVotes = await dbm.postVoteService.getPostVotes(postID);
  expect(postVotes.length).toBe(0);

  await dbm.postService.deletePost(postID);

  await closeDBM(dbm);
});
