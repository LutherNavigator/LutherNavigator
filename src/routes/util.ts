/**
 * Utilities for routes.
 * @packageDocumentation
 */

import { Request, Response, NextFunction } from "express";
import * as multer from "multer";
import { MetaService, UserService, SessionService } from "../services";
import { sessionAge } from "../services/util";

/**
 * Debug/production environment.
 */
const debug = !!parseInt(process.env.DEBUG);

/**
 * Error message maximum age.
 */
export const errorMessageAge = 60 * 1000; // one minute

/**
 * Maximum size an image can be (in bytes).
 */
export const maxImageSize = 262144;

/**
 * Multer disk storage.
 */
const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, Date.now() + file.originalname);
  },
});

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
  const sessionID: string = getSessionID(req);
  const validSession = sessionID
    ? await SessionService.sessionExists(sessionID)
    : false;

  if (validSession) {
    setSessionID(res, sessionID);
    await SessionService.updateSession(sessionID);
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
  const sessionID: string = getSessionID(req);
  const userID = await SessionService.getUserIDBySessionID(sessionID);
  const admin = userID ? await UserService.isAdmin(userID) : false;

  if (admin) {
    setSessionID(res, sessionID);
    await SessionService.updateSession(sessionID);
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
  options.url = req.originalUrl;

  const version = await MetaService.get("Version");
  options.version = version;

  const sessionID = getSessionID(req);

  if (!sessionID) {
    options.loggedIn = false;
  } else {
    const user = await SessionService.getUserBySessionID(sessionID);

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
 * @param res Response object.
 * @param sessionID A session ID.
 */
export function setSessionID(res: Response, sessionID: string): void {
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
 * Get the currently logged in user's ID.
 *
 * @param req Request object.
 * @returns The user's ID.
 */
export async function getUserID(req: Request): Promise<string> {
  const sessionID = getSessionID(req);
  const userID = await SessionService.getUserIDBySessionID(sessionID);

  return userID;
}
