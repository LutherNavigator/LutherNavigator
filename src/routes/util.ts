/**
 * Utilities for routes.
 * @packageDocumentation
 */

import { Request, Response, NextFunction } from "express";
import * as multer from "multer";
import DatabaseManager from "../services";
import { metaConfig } from "../config";

/**
 * Debug/production environment.
 */
const debug = !!parseInt(process.env.DEBUG);

/**
 * Error message maximum age.
 */
export const errorMessageAge = 60 * 1000; // one minute

/**
 * Form maximum age.
 */
export const formAge = 60 * 1000; // one minute

/**
 * Maximum size an image can be (in bytes).
 */
export const maxImageSize = 262144;

/**
 * Multer memory storage.
 */
const storage = multer.memoryStorage();

/**
 * Multer uploader.
 */
export const upload = multer({ storage });

/**
 * Authentication middleware.
 *
 * @param req Request object.
 * @param res Response object.
 * @param next Next function.
 */
export async function auth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const dbm = getDBM(req);

  const sessionID: string = getSessionID(req);
  const validSession = sessionID
    ? await dbm.sessionService.sessionExists(sessionID)
    : false;

  if (validSession) {
    await setSessionID(req, res, sessionID);
    await dbm.sessionService.updateSession(sessionID);
    next();
  } else {
    await renderPage(
      req,
      res,
      "401",
      {
        title: "Permission denied",
        after: req.originalUrl,
      },
      401
    );
  }
}

/**
 * Admin authentication middleware.
 *
 * @param req Request object.
 * @param res Response object.
 * @param next Next function.
 */
export async function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const dbm = getDBM(req);

  const sessionID: string = getSessionID(req);
  const userID = await dbm.sessionService.getUserIDBySessionID(sessionID);
  const admin = userID ? await dbm.userService.isAdmin(userID) : false;

  if (admin) {
    await setSessionID(req, res, sessionID);
    await dbm.sessionService.updateSession(sessionID);
    next();
  } else {
    await renderPage(
      req,
      res,
      "401",
      {
        title: "Permission denied",
        after: req.originalUrl,
      },
      401
    );
  }
}

/**
 * Render a webpage.
 *
 * @param req Request object.
 * @param res Response object.
 * @param page View to be rendered.
 * @param options Options to be passed to the view.
 * @param status HTTP status code.
 */
export async function renderPage(
  req: Request,
  res: Response,
  page: string,
  options: any = {},
  status: number = 200
): Promise<void> {
  const dbm = getDBM(req);

  options.url = req.originalUrl;

  if (options.loginAfter === undefined) {
    options.loginAfter = true;
  }

  if (options.loginAfter) {
    options.after = req.originalUrl;
  } else {
    options.after = req.query.after;
  }

  options.version = await dbm.metaService.get("Version");
  options.navMessage = await dbm.metaService.get("Nav message");

  const sessionID = getSessionID(req);

  if (!sessionID) {
    options.loggedIn = false;
  } else {
    const user = await dbm.sessionService.getUserBySessionID(sessionID);

    if (!user) {
      options.loggedIn = false;
    } else {
      options.loggedIn = true;
      options.userID = user.id;
      options.userFirstname = user.firstname;
      options.admin = user.admin;
    }
  }

  res.status(status).render(page, options);
}

/**
 * Render an error page.
 *
 * @param err The error.
 * @param req Request object.
 * @param res Response object.
 */
export async function renderError(
  err: Error,
  req: Request,
  res: Response
): Promise<void> {
  const options = !debug
    ? {}
    : {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };

  await renderPage(
    req,
    res,
    "500",
    Object.assign(options, { title: "Internal server error" }),
    500
  );

  console.error(err.stack);
}

/**
 * Get the database manager.
 *
 * @param req Request object.
 */
export function getDBM(req: Request): DatabaseManager {
  return req.app.get("dbm") as DatabaseManager;
}

/**
 * Get the hostname of a request.
 *
 * @param req Request object.
 */
export function getHostname(req: Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

/**
 * Get the session ID cookie.
 *
 * @param req Request object.
 * @returns The session ID.
 */
export function getSessionID(req: Request): string {
  return req.cookies.sessionID;
}

/**
 * Set the session ID cookie.
 *
 * @param req Request object.
 * @param res Response object.
 * @param sessionID A session ID.
 */
export async function setSessionID(
  req: Request,
  res: Response,
  sessionID: string
): Promise<void> {
  const dbm = getDBM(req);

  const sessionAge =
    (parseInt(await dbm.metaService.get("Session age")) ||
      metaConfig["Session age"]) * 1000;

  res.cookie("sessionID", sessionID, {
    maxAge: sessionAge,
    httpOnly: true,
  });
}

/**
 * Delete the session ID cookie.
 *
 * @param res Response object.
 */
export function deleteSessionID(res: Response): void {
  res.clearCookie("sessionID");
}

/**
 * Get the error message cookie.
 *
 * @param req Request object.
 * @param res Response object.
 * @returns The error message or a null value.
 */
export function getErrorMessage(req: Request, res: Response): string | null {
  const errorMessage = req.cookies.errorMessage || null;
  res.clearCookie("errorMessage");
  return errorMessage;
}

/**
 * Set the error message cookie.
 *
 * @param res Response object.
 * @param message Error message.
 */
export function setErrorMessage(res: Response, message: string): void {
  res.cookie("errorMessage", message, {
    maxAge: errorMessageAge,
    httpOnly: true,
  });
}

/**
 * Get the form cookie.
 *
 * @param req Request object.
 * @param res Response object.
 * @returns The form object or a null value.
 */
export function getForm(req: Request, res: Response): any | null {
  let form: any | null = null;

  try {
    form = JSON.parse(req.cookies.form) || null;
  } catch (err) {}

  res.clearCookie("form");
  return form;
}

/**
 * Set the form cookie.
 *
 * @param res Response object.
 * @param value Form object.
 */
export function setForm(res: Response, value: any): void {
  const jsonValue = JSON.stringify(value);
  res.cookie("form", jsonValue, {
    maxAge: formAge,
    httpOnly: true,
  });
}

/**
 * Get the currently logged in user's ID.
 *
 * @param req Request object.
 * @returns The user's ID.
 */
export async function getUserID(req: Request): Promise<string> {
  const dbm = getDBM(req);

  const sessionID = getSessionID(req);
  const userID = await dbm.sessionService.getUserIDBySessionID(sessionID);

  return userID;
}

/**
 * Convert a string from camel case to title case.
 *
 * @param str A camel case string.
 * @returns The string in title case.
 */
export function camelToTitle(str: string): string {
  return (
    str.charAt(0).toUpperCase() +
    str.substr(1).replace(/[A-Z]/g, (text: string) => {
      return " " + text.toLowerCase();
    })
  );
}
