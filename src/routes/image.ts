/**
 * Image routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { renderError, getDBM } from "./util";
import wrapRoute from "../asyncCatch";
import proxy from "../proxy";

/**
 * The image router.
 */
export const imageRouter = Router();

// Get an image
imageRouter.get(
  "/id/:imageID",
  wrapRoute(async (req, res, next) => {
    const dbm = getDBM(req);

    const imageID = req.params.imageID;

    const image = await dbm.imageService.getImage(imageID);

    if (image) {
      res.write(image.data, async (err) => {
        if (err) {
          await renderError(err, req, res);
        }
        res.end();
      });
    } else {
      next(); // 404
    }
  })
);

// Get a user's image
imageRouter.get(
  "/user/:userID",
  wrapRoute(async (req, res, next) => {
    const dbm = getDBM(req);

    const userExists = await dbm.userService.userExists(req.params.userID);

    if (userExists) {
      const image = await dbm.userService.getUserImage(req.params.userID);

      if (image) {
        res.write(image.data, async (err) => {
          if (err) {
            await renderError(err, req, res);
          }
          res.end();
        });
      } else {
        const host = req.protocol + "://" + req.get("host");
        proxy(res, host + "/img/compass_b.png");
      }
    } else {
      next(); // 404
    }
  })
);

// Get a post's image
imageRouter.get(
  "/post/:postID/:id",
  wrapRoute(async (req, res, next) => {
    const dbm = getDBM(req);

    const postID = req.params.postID;
    const id = parseInt(req.params.id);

    const postExists = await dbm.postService.postExists(postID);

    if (postExists) {
      const images = await dbm.postService.getPostImages(postID);
      const image = images[id]?.data;

      if (image) {
        res.write(image, async (err) => {
          if (err) {
            await renderError(err, req, res);
          }
          res.end();
        });
      } else {
        res.sendFile("vienna.jpg", { root: "static/img" });
      }
    } else {
      next(); // 404
    }
  })
);
