/**
 * Edit post routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { adminAuth, renderPage, getDBM, getErrorMessage } from "./util";
import wrapRoute from "../asyncCatch";
import { metaConfig } from "../config";

/**
 * The edit post router.
 */
export const editPostRouter = Router();

// Edit post page
editPostRouter.get(
  "/:postID",
  adminAuth,
  wrapRoute(async (req, res, next) => {
    const dbm = getDBM(req);

    const postID = req.params.postID;

    const post = await dbm.postService.getPost(postID);
    if (!post) {
      next(); // 404
      return;
    }

    const error = getErrorMessage(req, res);
    const locationTypes = await dbm.locationTypeService.getLocations();
    const programs = await dbm.programService.getPrograms();
    const maxImages =
      parseInt(await dbm.metaService.get("Images per post")) ||
      metaConfig["Images per post"];
    const [wordOne, wordTwo, wordThree] = post.threeWords.split(", ");
    const images = await dbm.postService.getPostImages(postID);

    await renderPage(req, res, "editPost", {
      title: "Edit post",
      error,
      postID,
      locationTypes,
      programs,
      maxImages,
      location: post.location,
      city: post.city,
      country: post.country,
      locationType: post.locationTypeID,
      program: post.programID,
      postContent: post.content,
      wordOne,
      wordTwo,
      wordThree,
      address: post.address,
      phone: post.phone,
      website: post.website,
      images,
    });
  })
);

// Edit post event
editPostRouter.post(
  "/:postID",
  adminAuth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const postID = req.params.postID;

    res.redirect(`/post/${postID}`);
  })
);
