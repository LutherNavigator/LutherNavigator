/**
 * Post routes.
 * @packageDocumentation
 */

import { Router } from "express";
import {
  auth,
  upload,
  getDBM,
  getUserID,
  maxImageSize,
  renderPage,
  getErrorMessage,
  setErrorMessage,
  getForm,
  setForm,
  camelToTitle,
} from "./util";
import wrapRoute from "../asyncCatch";
import { RatingParams } from "../services/rating";
import { metaConfig } from "../config";
import * as jimp from "jimp";

/**
 * The post router.
 */
export const postRouter = Router();

/**
 * Things users can rate locations on.
 */
const ratingTypes = [
  "general",
  "cost",
  "quality",
  "safety",
  "cleanliness",
  "guestServices",
];

// Create post page
postRouter.get(
  "/",
  auth,
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const error = getErrorMessage(req, res);
    const form = getForm(req, res);
    const locationTypes = await dbm.locationTypeService.getLocations();
    const programs = await dbm.programService.getPrograms();
    const maxImages =
      parseInt(await dbm.metaService.get("Images per post")) ||
      metaConfig["Images per post"];

    await renderPage(req, res, "createPost", {
      title: "New post",
      error,
      form,
      locationTypes,
      programs,
      ratingTypes: ratingTypes.map((ratingType) => ({
        name: ratingType,
        displayName:
          ratingType === "general"
            ? "General rating"
            : camelToTitle(ratingType),
        required: ratingType === "general",
      })),
      maxImages,
    });
  })
);

// Create post event
postRouter.post(
  "/",
  auth,
  upload.array("images", 25),
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const mimetypes = ["image/png", "image/jpg", "image/jpeg"];
    const userID = await getUserID(req);
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
    const ratings = ratingTypes.map(
      (ratingType) => parseInt(req.body[`${ratingType}Rating`]) || 0
    );

    const validLocationTypeID = await dbm.locationTypeService.validLocation(
      locationTypeID
    );
    const imageData = await Promise.all(
      files.map(
        async (file): Promise<Buffer> => {
          return new Promise((resolve) => {
            if (file.size < maxImageSize) {
              resolve(file.buffer);
            } else {
              jimp.read(file.buffer).then((img) => {
                const shrinkFactor = (file.size / maxImageSize) ** 0.3 / 0.8;
                const width = img.bitmap.width;
                img
                  .resize(Math.floor(width / shrinkFactor), jimp.AUTO)
                  .quality(60)
                  .getBufferAsync(jimp.MIME_JPEG)
                  .then((buffer) => {
                    resolve(buffer);
                  });
              });
            }
          });
        }
      )
    );
    const imageTypesGood = files.map((file) =>
      mimetypes.includes(file.mimetype)
    );
    const imageSizesGood = imageData.map(
      (image) => image.length < maxImageSize
    );
    const ratingsGood = ratings.map((rating) => rating >= 0 && rating <= 5);

    // Validation
    if (content.length <= 0 || content.length > 750) {
      setErrorMessage(res, "Post content must be no more than 750 characters");
    } else if (imageData.length < 0 || imageData.length > maxImages) {
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
    } else if (ratingsGood.includes(false)) {
      setErrorMessage(res, "Invalid rating");
    } else if (parseInt(req.body.generalRating) === 0) {
      setErrorMessage(res, "General rating is required");
    } else {
      // Create post
      const rating = ratingTypes.reduce((obj, current) => {
        const value = parseInt(req.body[`${current}Rating`]) || 0;
        if (value !== 0) {
          obj[current] = value;
        }
        return obj;
      }, {}) as RatingParams;

      const postID = await dbm.postService.createPost(
        userID,
        content,
        imageData,
        location,
        city,
        country,
        locationTypeID,
        programID,
        rating,
        threeWords,
        address,
        phone,
        website
      );

      res.redirect(`/post/${postID}`);
      return;
    }

    const rating = ratingTypes.map((ratingType) => ({
      name: ratingType,
      value: parseInt(req.body[`${ratingType}Rating`]) || 0,
    }));

    let form = req.body;
    form.ratings = rating;
    setForm(res, form);
    res.redirect("/post");
  })
);

// Post page
postRouter.get(
  "/:postID",
  wrapRoute(async (req, res, next) => {
    const dbm = getDBM(req);

    const postID = req.params.postID;
    const userID = await getUserID(req);
    const user = await dbm.userService.getUser(userID);
    let error: string = null;

    const post = await dbm.postService.getPost(postID);
    if (!post) {
      next(); // 404
      return;
    }

    const postUser = await dbm.postService.getPostUser(postID);
    if (!post.approved) {
      if (user && (user.admin || postUser.id === userID)) {
        // The user is an admin or the creator of the post
        error =
          "This post has not yet been approved, and is not publicly available";
      } else {
        next(); // 404
        return;
      }
    }

    const postUserStatusName = await dbm.userStatusService.getStatusName(
      post.currentUserStatusID
    );
    const program = await dbm.programService.getProgramName(post.programID);
    const images = await dbm.postService.getPostImages(postID);
    const postRating = await dbm.postService.getPostRating(postID);
    let ratings = [];

    for (const rating in postRating) {
      if (rating !== "id" && postRating[rating] !== null) {
        ratings.push({ name: camelToTitle(rating), value: postRating[rating] });
      }
    }

    const addressURL = post.address
      ? "https://www.google.com/maps/place/" + post.address.replace(/ /g, "+")
      : null;
    const phoneFormatted = post.phone
      ? `${
          post.phone.length > 10 ? `+${post.phone.slice(0, -10)} ` : ""
        }(${post.phone.slice(-10, -7)}) ${post.phone.slice(
          -7,
          -4
        )}-${post.phone.slice(-4)}`
      : null;
    const websiteURL = post.website
      ? post.website.startsWith("http://") ||
        post.website.startsWith("https://")
        ? post.website
        : "http://" + post.website
      : null;

    const upvoted = await dbm.postVoteService.voted(userID, postID);
    const numUpvotes = await dbm.postVoteService.getNumPostVotes(
      postID,
      "Upvote"
    );

    await renderPage(req, res, "post", {
      title: post.location,
      error,
      postID,
      location: post.location,
      city: post.city,
      country: post.country,
      firstname: postUser.firstname,
      lastname: postUser.lastname,
      status: postUserStatusName,
      program: program,
      createTime: post.createTime,
      threeWords: post.threeWords,
      content: post.content,
      address: post.address,
      addressURL,
      phone: post.phone,
      phoneFormatted,
      website: post.website,
      websiteURL,
      images,
      ratings,
      userPost: postUser.id === userID,
      upvoted,
      numUpvotes,
    });
  })
);

// Post deletion event
postRouter.post(
  "/:postID/delete",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const postID = req.params.postID;
    const userID = await getUserID(req);
    const post = await dbm.postService.getPost(postID);

    if (post.userID === userID) {
      dbm.postService.deletePost(postID);
    }

    res.redirect("/");
  })
);
