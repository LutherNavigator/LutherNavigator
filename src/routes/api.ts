/**
 * API routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { adminAuth, getDBM, getHostname } from "./util";
import { getTime } from "../services/util";
import wrapRoute from "../asyncCatch";
import { metaConfig } from "../config";
import { sendFormattedEmail } from "../emailer";

/**
 * The API router.
 */
export const apiRouter = Router();

// Admin stats
apiRouter.get(
  "/adminStats",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const numUsers = await dbm.adminService.getRecords("User");
    const numPosts = await dbm.adminService.getRecords("Post");
    const numLoggedIn = await dbm.adminService.getRecords("Session");
    const numSuspended = await dbm.adminService.getRecords("Suspended");

    res.json({
      Users: { value: numUsers, id: "users" },
      Posts: { value: numPosts, id: "posts" },
      Sessions: { value: numLoggedIn },
      Suspended: { value: numSuspended },
    });
  })
);

// Get all users
apiRouter.get(
  "/getUsers",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const users = await dbm.adminService.getUsers();

    res.json(users);
  })
);

// Get all posts
apiRouter.get(
  "/getPosts",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const posts = await dbm.adminService.getPosts();

    res.json(posts);
  })
);

// Delete a user
apiRouter.get(
  "/deleteUser",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const userID = req.query.userID as string;
    const reason = req.query.reason as string;

    const user = await dbm.userService.getUser(userID);

    await dbm.userService.deleteUser(userID);

    await sendFormattedEmail(
      user.email,
      "Luther Navigator - Account Deleted",
      "accountDeleted",
      {
        host: getHostname(req),
        reason,
      }
    );

    res.end();
  })
);

// Delete a post
apiRouter.get(
  "/deletePost",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const postID = req.query.postID as string;
    const reason = req.query.reason as string;

    const postUser = await dbm.postService.getPostUser(postID);

    await dbm.postService.deletePost(postID);

    await sendFormattedEmail(
      postUser.email,
      "Luther Navigator - Post Deleted",
      "postDeleted",
      {
        host: getHostname(req),
        reason,
      }
    );

    res.end();
  })
);

// Admin variables
apiRouter.get(
  "/adminVariables",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const variables = await dbm.metaService.getAll();

    res.json(variables);
  })
);

// Set variable
apiRouter.get(
  "/setVariable",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const name = req.query.name as string;
    const value = req.query.value as string;
    const exists = await dbm.metaService.exists(name);

    if (exists) {
      await dbm.metaService.set(name, value);
    }

    res.end();
  })
);

// Reset variable
apiRouter.get(
  "/resetVariable",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const name = req.query.name as string;

    if (name in metaConfig) {
      await dbm.metaService.set(name, metaConfig[name]);
    }

    res.send(String(metaConfig[name])).end();
  })
);

// Get unapproved users
apiRouter.get(
  "/unapprovedUsers",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const unapproved = await dbm.userService.getUnapproved();

    res.json(unapproved);
  })
);

// Approve registration
apiRouter.get(
  "/approveRegistration",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const userID = req.query.userID as string;
    const approved =
      req.query.approved === undefined || req.query.approved === "true";
    const reason = req.query.reason as string;

    const user = await dbm.userService.getUser(userID);

    if (approved) {
      await dbm.userService.setApproved(userID);
      await sendFormattedEmail(
        user.email,
        "Luther Navigator - Account Approved",
        "accountApproved",
        {
          host: getHostname(req),
        }
      );
    } else {
      const isApproved = await dbm.userService.isApproved(userID);

      if (!isApproved) {
        await dbm.userService.deleteUser(userID);
        await sendFormattedEmail(
          user.email,
          "Luther Navigator - Account Not Approved",
          "accountNotApproved",
          {
            host: getHostname(req),
            reason,
          }
        );
      }
    }

    res.end();
  })
);

// Get unapproved posts
apiRouter.get(
  "/unapprovedPosts",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const unapproved = await dbm.postService.getUnapproved();

    res.json(unapproved);
  })
);

// Approve a post
apiRouter.get(
  "/approvePost",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const postID = req.query.postID as string;
    const approved =
      req.query.approved === undefined || req.query.approved === "true";
    const reason = req.query.reason as string;

    const post = await dbm.postService.getPost(postID);
    const user = await dbm.postService.getPostUser(postID);

    if (approved) {
      await dbm.postService.setApproved(postID);
      await sendFormattedEmail(
        user.email,
        "Luther Navigator - Post Approved",
        "postApproved",
        {
          host: getHostname(req),
          postID,
          location: post.location,
        }
      );
    } else {
      const isApproved = await dbm.postService.isApproved(postID);

      if (!isApproved) {
        await dbm.postService.deletePost(postID);
        await sendFormattedEmail(
          user.email,
          "Luther Navigator - Post Not Approved",
          "postNotApproved",
          {
            host: getHostname(req),
            location: post.location,
            reason,
          }
        );
      }
    }

    res.end();
  })
);

// Get list of programs
apiRouter.get(
  "/adminPrograms",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const programs = await dbm.programService.getPrograms();

    res.json(programs);
  })
);

// Create a new program
apiRouter.get(
  "/createProgram",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const programName = req.query.programName as string;

    const programID = await dbm.programService.createProgram(programName);

    res.send(String(programID)).end();
  })
);

// Set a program
apiRouter.get(
  "/setProgram",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const programID = parseInt(req.query.programID as string);
    const programName = req.query.programName as string;

    if (isNaN(programID)) {
      res.send("Program ID must be a number").end();
    } else {
      const exists = await dbm.programService.programExists(programID);

      if (exists) {
        await dbm.programService.setProgramName(programID, programName);

        res.end();
      } else {
        res.send("A program with the specified ID does not exist").end();
      }
    }
  })
);

// Delete a program
apiRouter.get(
  "/deleteProgram",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const programID = parseInt(req.query.programID as string);

    if (isNaN(programID)) {
      res.send("Program ID must be a number").end();
    } else {
      const linkedPosts = await dbm.programService.numLinkedPosts(programID);

      if (linkedPosts === 0) {
        await dbm.programService.deleteProgram(programID);

        res.end();
      } else {
        res
          .send(
            "This program cannot be deleted as it is associated with one or more posts"
          )
          .end();
      }
    }
  })
);

// Get user status change requests
apiRouter.get(
  "/statusChangeRequests",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const requests = await dbm.userStatusChangeService.getUserRequests();

    res.json(requests);
  })
);

// Approve/deny a status change request
apiRouter.get(
  "/approveStatusChangeRequest",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const requestID = req.query.requestID as string;
    const approved =
      req.query.approved === undefined || req.query.approved === "true";

    const request = await dbm.userStatusChangeService.getStatusChangeRequest(
      requestID
    );

    if (request) {
      const user = await dbm.userService.getUser(request.userID);

      if (approved) {
        await dbm.userStatusChangeService.approveStatusChangeRequest(requestID);
        await sendFormattedEmail(
          user.email,
          "Luther Navigator - Status Change Approved",
          "statusChangeApproved",
          {
            host: getHostname(req),
          }
        );
      } else {
        await dbm.userStatusChangeService.denyStatusChangeRequest(requestID);
        await sendFormattedEmail(
          user.email,
          "Luther Navigator - Status Change Not Approved",
          "statusChangeNotApproved",
          {
            host: getHostname(req),
          }
        );
      }
    }

    res.end();
  })
);

// Get suspended users
apiRouter.get(
  "/suspendedUsers",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const suspended = await dbm.suspendedService.suspendedUsers();

    res.json(suspended);
  })
);

// Suspend a user's account
apiRouter.get(
  "/suspendAccount",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const userID = req.query.userID as string;
    const duration = req.query.duration as string;

    const suspendUntil = getTime() + parseInt(duration) * 60 * 60 * 24;

    const suspensionID = await dbm.suspendedService.suspendUser(
      userID,
      suspendUntil
    );

    const user = await dbm.userService.getUser(userID);

    await sendFormattedEmail(
      user.email,
      "Luther Navigator - Account Suspended",
      "suspended",
      {
        host: getHostname(req),
        duration: `${duration} day${duration === "1" ? "" : "s"}`,
      }
    );

    res.send(suspensionID).end();
  })
);

// End an account suspension
apiRouter.get(
  "/endSuspension",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const suspensionID = req.query.suspensionID as string;

    await dbm.suspendedService.deleteSuspension(suspensionID);

    res.end();
  })
);
