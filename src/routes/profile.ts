/**
 * Profile routes.
 * @packageDocumentation
 */

import { Router } from "express";
import {
  renderPage,
  auth,
  upload,
  getDBM,
  getHostname,
  getUserID,
  maxImageSize,
  setErrorMessage,
  getErrorMessage,
  getSessionID,
} from "./util";
import wrapRoute from "../asyncCatch";
import { sendFormattedEmail } from "../emailer";
import { checkPassword } from "../services/util";

/**
 * The profile router.
 */
export const profileRouter = Router();

// Profile page
profileRouter.get(
  "/",
  auth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const userID = await getUserID(req);
    const user = await dbm.userService.getUser(userID);
    const posts = await dbm.postService.getUserPosts(userID);
    const userStatus = await dbm.userStatusService.getStatusName(user.statusID);
    let userStatuses = await dbm.userStatusService.getStatuses();

    for (let i = 0; i < userStatuses.length; i++) {
      if (userStatuses[i].id === user.statusID) {
        userStatuses.splice(i, 1);
      }
    }

    await renderPage(req, res, "profile", {
      title: "Your profile",
      error: getErrorMessage(req, res),
      userID: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      userStatus,
      userStatuses,
      joinTime: user.joinTime,
      numPosts: `${posts.length} ${posts.length === 1 ? "post" : "posts"}`,
      hasPosts: posts.length > 0,
      posts,
    });
  })
);

// Set image event
profileRouter.post(
  "/setImage",
  auth,
  upload.single("image"),
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    if (!["image/png", "image/jpg", "image/jpeg"].includes(req.file.mimetype)) {
      setErrorMessage(res, "Profile image must be in PNG, JPG, or JPEG format");
    } else if (req.file.size >= maxImageSize) {
      setErrorMessage(
        res,
        `Profile image must be less than ${Math.floor(maxImageSize / 1024)} KB`
      );
    } else {
      const userID = await getUserID(req);
      const imageData = req.file.buffer;
      await dbm.userService.setUserImage(userID, imageData);
    }

    res.redirect("/profile");
  })
);

// Change password event
profileRouter.post(
  "/changePassword",
  auth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const currentPassword: string = req.body.currentPassword;
    const newPassword: string = req.body.newPassword;
    const confirmNewPassword: string = req.body.confirmNewPassword;

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(res, "Passwords do not match");
    } else if (newPassword.length < 8) {
      setErrorMessage(res, "New password must be at least 8 characters");
    } else {
      const sessionID = getSessionID(req);
      const user = await dbm.sessionService.getUserBySessionID(sessionID);
      const match = await checkPassword(currentPassword, user.password);

      if (!match) {
        setErrorMessage(res, "Incorrect password");
      } else {
        await dbm.userService.setUserPassword(user.id, newPassword);
      }
    }

    res.redirect("/profile");
  })
);

// Request email change event
profileRouter.post(
  "/changeEmail",
  auth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const userID = await getUserID(req);
    const newEmail = req.body.newEmail;

    const emailChangeID = await dbm.emailChangeService.createEmailChangeRecord(
      userID,
      newEmail
    );

    await sendFormattedEmail(
      newEmail,
      "Luther Navigator - Email Change Request",
      "emailChange",
      {
        host: getHostname(req),
        emailChangeID,
      }
    );

    res.redirect("/profile");
  })
);

// Request user status change event
profileRouter.post(
  "/changeUserStatus",
  auth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const userID = await getUserID(req);
    const newUserStatus = parseInt(req.body.newUserStatus);

    if (isNaN(newUserStatus)) {
      setErrorMessage(res, "Invalid status");
    } else {
      const validUserStatus = await dbm.userStatusService.validStatus(
        newUserStatus
      );

      if (!validUserStatus) {
        setErrorMessage(res, "Invalid status");
      } else {
        await dbm.userStatusChangeService.createStatusChangeRequest(
          userID,
          newUserStatus
        );
      }
    }

    res.redirect("/profile");
  })
);
