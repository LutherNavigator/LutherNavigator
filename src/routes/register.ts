/**
 * Register routes.
 * @packageDocumentation
 */

import { Router } from "express";
import {
  renderPage,
  getDBM,
  getErrorMessage,
  setErrorMessage,
  getHostname,
  getForm,
  setForm,
} from "./util";
import wrapRoute from "../asyncCatch";
import { sendFormattedEmail } from "../emailer";

/**
 * The register router.
 */
export const registerRouter = Router();

// Register page
registerRouter.get(
  "/",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const error = getErrorMessage(req, res);
    const form = getForm(req, res);
    const userStatuses = await dbm.userStatusService.getStatuses();

    await renderPage(req, res, "register", {
      error,
      form,
      userStatuses,
    });
  })
);

// Register event
registerRouter.post(
  "/",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const firstname: string = req.body.firstname;
    const lastname: string = req.body.lastname;
    const email: string = req.body.email;
    const password: string = req.body.password;
    const confirmPassword: string = req.body.confirmPassword;
    const userStatus: number = parseInt(req.body.userStatus) || 0;

    const emailUnique = await dbm.userService.uniqueEmail(email);
    const validUserStatus = await dbm.userStatusService.validStatus(userStatus);

    // Validation
    if (firstname.length < 1 || firstname.length > 63) {
      setErrorMessage(res, "First name must be less than 64 characters");
    } else if (lastname.length < 1 || lastname.length > 63) {
      setErrorMessage(res, "Last name must be less than 64 characters");
    } else if (email.length < 5 || email.length > 63) {
      setErrorMessage(res, "Email must be less than 64 characters");
    } else if (password !== confirmPassword) {
      setErrorMessage(res, "Passwords do not match");
    } else if (password.length < 8) {
      setErrorMessage(res, "Password must be at least 8 characters");
    } else if (!emailUnique) {
      setErrorMessage(res, "Email address is already in use");
    } else if (!validUserStatus) {
      setErrorMessage(res, "Invalid user status");
    } else {
      // Verification
      const verifyID = await dbm.verifyService.createVerifyRecord(email);

      if (verifyID) {
        const userID = await dbm.userService.createUser(
          firstname,
          lastname,
          email,
          password,
          userStatus
        );

        sendFormattedEmail(
          email,
          "Luther Navigator - Verify Email",
          "verification",
          {
            host: getHostname(req),
            verifyID,
          }
        );
      }

      res.redirect("/register/register-success");
      return;
    }

    setForm(res, req.body);
    res.redirect("/register");
  })
);

// Registration success
registerRouter.get(
  "/register-success",
  wrapRoute(async (req, res) => {
    await renderPage(req, res, "registerSuccess");
  })
);

// Verify an account
registerRouter.get(
  "/verify/:verifyID",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const verifyID = req.params.verifyID;
    const success = await dbm.verifyService.verifyUser(verifyID);

    await renderPage(req, res, "registerVerify", {
      valid: success,
    });
  })
);
