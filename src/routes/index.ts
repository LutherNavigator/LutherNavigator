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

/**
 * A featured program.
 */
interface FeaturedProgram {
  programID: number;
  imageName: string;
}

/**
 * A featured program with program name.
 */
interface FeaturedProgramFull {
  programID: number;
  imageName: string;
  programName: string;
}

/**
 * Map of featured programs to their IDs and images.
 */
const featuredPrograms: FeaturedProgram[] = [
  { programID: 1, imageName: "j-term" },
  { programID: 131, imageName: "nottingham" },
  { programID: 141, imageName: "malta" },
  { programID: 151, imageName: "münster" },
  { programID: 454, imageName: "adriatic" },
  { programID: 464, imageName: "nottingham-summer" },
  { programID: 474, imageName: "washington" },
  { programID: 484, imageName: "rochester" },
  { programID: 494, imageName: "chicago" },
  { programID: 999999, imageName: "other" },
];

function getFeatured(num: number): FeaturedProgram[] {
  let featured = [];
  let remaining = [...featuredPrograms];

  for (let i = 0; i < num; i++) {
    const index = Math.floor(Math.random() * remaining.length);
    featured.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return featured;
}

// Index page
indexRouter.get(
  "/",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const googleAnalyticsID = await dbm.metaService.get("Google Analytics ID");
    const adminFavorites = await dbm.adminFavoritesService.getRecentFavorites(
      3
    );
    const featuredThree = getFeatured(3);
    const featured = await Promise.all(
      featuredThree.map(
        async (program): Promise<FeaturedProgramFull> => ({
          programID: program.programID,
          imageName: program.imageName,
          programName: await dbm.programService.getProgramName(
            program.programID
          ),
        })
      )
    );

    await renderPage(req, res, "index", {
      googleAnalyticsID,
      adminFavorites,
      featured,
    });
  })
);
