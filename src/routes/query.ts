/**
 * Query routes.
 * @packageDocumentation
 */

import { Router } from "express";
import { renderPage, getDBM } from "./util";
import wrapRoute from "../asyncCatch";
import { QueryParams, QuerySortOptions } from "../services/query";

/**
 * The query router.
 */
export const queryRouter = Router();

// Query page
queryRouter.get(
  "/",
  wrapRoute(async (req, res) => {
    const dbm = getDBM(req);

    const locationTypes = await dbm.locationTypeService.getLocations();
    const programs = await dbm.programService.getPrograms();
    const userStatuses = await dbm.userStatusService.getStatuses();

    if (Object.keys(req.query).length === 0) {
      await renderPage(req, res, "query", {
        locationTypes,
        programs,
        userStatuses,
      });
    } else {
      let queryParams: QueryParams = {
        programIDs: [],
        locationTypeIDs: [],
        statusIDs: [],
        ratings: [],
      };

      if (req.query.search !== undefined) {
        queryParams.search = req.query.search as string;
      }

      for (const arg in req.query) {
        const argNumStart = arg.indexOf("-");
        const argNum = parseInt(arg.slice(argNumStart + 1));

        if (!isNaN(argNum)) {
          if (arg.startsWith("prog")) {
            queryParams.programIDs.push(argNum);
          } else if (arg.startsWith("loc")) {
            queryParams.locationTypeIDs.push(argNum);
          } else if (arg.startsWith("user")) {
            queryParams.statusIDs.push(argNum);
          } else if (arg.startsWith("star")) {
            queryParams.ratings.push(argNum);
          }
        }
      }

      let sortBy = req.query.sortBy as QuerySortOptions;
      let sortOrder = Boolean(parseInt(req.query.sortOrder as string));

      if (
        sortBy !== "program" &&
        sortBy !== "locationType" &&
        sortBy !== "userStatus" &&
        sortBy !== "rating" &&
        sortBy !== "timestamp" &&
        sortBy !== "city" &&
        sortBy !== "country"
      ) {
        sortBy = "timestamp";
        sortOrder = false;
      }

      const results =
        Object.keys(req.query).length === 1 && req.query.search !== undefined
          ? await dbm.queryService.query(queryParams.search)
          : await dbm.queryService.advancedQuery(
              queryParams,
              sortBy,
              sortOrder
            );

      await renderPage(req, res, "query", {
        locationTypes,
        programs,
        userStatuses,
        posts: results,
      });
    }
  })
);
