/**
 * Edit post routes.
 * @packageDocumentation
 */

import { Router } from "express";
import {
  adminAuth,
  upload,
  renderPage,
  getDBM,
  maxImageSize,
  getErrorMessage,
  setErrorMessage,
} from "./util";
import wrapRoute from "../asyncCatch";
import { metaConfig } from "../config";
import { shrinkImageAuto } from "./post";

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
  upload.array("images", 25),
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const postID = req.params.postID;

    const mimetypes = ["image/png", "image/jpg", "image/jpeg"];
    const maxImages =
      parseInt(await dbm.metaService.get("Images per post")) ||
      metaConfig["Images per post"];

    const content: string = req.body.postContent;
    const files = req.files as Express.Multer.File[];
    const location: string = req.body.location;
    const city: string = req.body.city;
    const country: string = req.body.country;
    const locationTypeID: number = parseInt(req.body.locationType) || 0;
    const programID: number = parseInt(req.body.program);
    const threeWords = [
      (req.body.wordOne as string).trim(),
      (req.body.wordTwo as string).trim(),
      (req.body.wordThree as string).trim(),
    ]
      .filter((word) => !!word)
      .join(", ");
    const address: string = req.body.address || null;
    const phone: string = req.body.phone.replace(/[\(\) \-\+]/g, "") || null;
    const website: string = req.body.website || null;

    const validLocationTypeID = await dbm.locationTypeService.validLocation(
      locationTypeID
    );
    const validProgramID = await dbm.programService.programExists(programID);
    const imageData = await Promise.all(
      files.map(async (file) => await shrinkImageAuto(file))
    );
    const imageTypesGood = files.map((file) =>
      mimetypes.includes(file.mimetype)
    );
    const imageSizesGood = imageData.map(
      (image) => image.length < maxImageSize
    );
    const numImages = await dbm.postImageService.numImages(postID);
    const removeImages = Array.from(Array(numImages).keys()).filter(
      (num) => req.body[`image-${num}`] === undefined
    );
    const totalImages = numImages - removeImages.length + imageData.length;

    // Validation
    if (content.length <= 0 || content.length > 750) {
      setErrorMessage(res, "Post content must be no more than 750 characters");
    } else if (totalImages < 0 || totalImages > maxImages) {
      setErrorMessage(res, `Please upload no more than ${maxImages} images`);
    } else if (imageTypesGood.includes(false)) {
      setErrorMessage(res, "All images must be in PNG, JPG, or JPEG format");
    } else if (imageSizesGood.includes(false)) {
      setErrorMessage(
        res,
        `Please use images less than ${Math.floor(maxImageSize / 1024)} KB`
      );
    } else if (location.length <= 0 || location.length > 255) {
      setErrorMessage(res, "Location name must be less than 256 characters");
    } else if (city.length <= 0 || city.length > 255) {
      setErrorMessage(res, "City name must be less than 256 characters");
    } else if (country.length <= 0 || country.length > 255) {
      setErrorMessage(res, "Country name must be less than 256 characters");
    } else if (!validLocationTypeID) {
      setErrorMessage(res, "Invalid location type");
    } else if (!validProgramID) {
      setErrorMessage(res, "Invalid program");
    } else if (threeWords.length < 0 || threeWords.length > 63) {
      setErrorMessage(
        res,
        "Three word description must total to less than 64 characters"
      );
    } else if (
      phone &&
      (isNaN(parseInt(phone)) || phone.length < 10 || phone.length > 13)
    ) {
      setErrorMessage(res, "Invalid phone number");
    } else if (parseInt(req.body.generalRating) === 0) {
      setErrorMessage(res, "General rating is required");
    } else {
      // Edit post
      await dbm.postService.editPost(postID, {
        content,
        location,
        city,
        country,
        locationTypeID,
        programID,
        threeWords,
        address,
        phone,
        website,
      });

      await Promise.all(
        removeImages.map(
          async (index) =>
            await dbm.postImageService.deletePostImage(postID, index)
        )
      );
      await dbm.postImageService.createPostImages(postID, imageData);

      res.redirect(`/post/${postID}`);
      return;
    }

    res.redirect(`/edit-post/${postID}`);
  })
);
