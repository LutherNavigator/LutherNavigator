/**
 * About routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { renderPage } from "./util";
import wrapRoute from "../asyncCatch";

/**
 * The about router.
 */
export const aboutRouter = Router();

// About page
aboutRouter.get(
  "/",
  wrapRoute(async (req, res) => {
    await renderPage(req, res, "about");
  })
);
