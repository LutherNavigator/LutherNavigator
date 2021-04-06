/**
 * CGL favorites routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { renderPage, getDBM } from "./util";
import wrapRoute from "../asyncCatch";

/**
 * The CGL favorites router.
 */
export const cglFavoritesRouter = Router();

// CGL favorites page
cglFavoritesRouter.get(
  "/",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const adminFavorites = await dbm.adminFavoritesService.getFavoritePosts();

    await renderPage(req, res, "cglFavorites", {
      adminFavorites,
    });
  })
);
