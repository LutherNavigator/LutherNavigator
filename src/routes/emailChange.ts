/**
 * Email change routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { renderPage, getDBM } from "./util";
import wrapRoute from "../asyncCatch";

/**
 * The email change router.
 */
export const emailChangeRouter = Router();

// Email change page
emailChangeRouter.get(
  "/:emailChangeID",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const emailChangeID = req.params.emailChangeID;
    const success = await dbm.emailChangeService.changeEmail(emailChangeID);

    await renderPage(req, res, "emailChange", {
      valid: success,
    });
  })
);
