/**
 * Index routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { renderPage, getDBM } from "./util";
import wrapRoute from "../asyncCatch";

/**
 * The index router.
 */
export const indexRouter = Router();

// Index page
indexRouter.get(
  "/",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const googleAnalyticsID = await dbm.metaService.get("Google Analytics ID");
    const adminFavorites = await dbm.adminFavoritesService.getRecentFavorites(
      3
    );

    await renderPage(req, res, "index", {
      googleAnalyticsID,
      adminFavorites,
    });
  })
);
