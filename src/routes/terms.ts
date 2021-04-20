/**
 * Terms routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { renderPage } from "./util";
import wrapRoute from "../asyncCatch";

/**
 * The terms router.
 */
export const termsRouter = Router();

// Terms page
termsRouter.get(
  "/",
  wrapRoute(async (req, res) => {
    await renderPage(req, res, "terms");
  })
);
