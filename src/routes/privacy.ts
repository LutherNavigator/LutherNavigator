/**
 * Privacy routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { renderPage } from "./util";
import wrapRoute from "../asyncCatch";

/**
 * The privacy router.
 */
export const privacyRouter = Router();

// Privacy page
privacyRouter.get(
  "/",
  wrapRoute(async (req, res) => {
    await renderPage(req, res, "privacy");
  })
);
