/**
 * Index file for the project.
 * @packageDocumentation
 */

import * as express from "express";
import * as hbs from "express-handlebars";
import * as enforce from "express-sslify";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as routes from "./routes";
import { renderPage, renderError } from "./routes/util";
import DatabaseManager from "./services";
import initDB from "./dbinit";
import { helpers } from "./helpers";

/**
 * Debug/production environment.
 */
const debug = !!parseInt(process.env.DEBUG);

/**
 * Port number to use.
 */
const port = parseInt(process.env.PORT);

/**
 * Database URL.
 */
const dbURL = process.env.DATABASE_URL;

/**
 * Express app.
 */
const app = express();

// Disable caching for authentication purposes
app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// Enforce HTTPS
if (!debug) {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

// Use view engine
app.engine(
  ".html",
  hbs({
    extname: ".html",
    defaultLayout: "default",
    helpers,
  })
);
app.set("view engine", ".html");

// Request body parsing
app.use(bodyParser.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Include static directory for css and js files
app.use(express.static("static"));

// Use routes
app.use("/", routes.indexRouter);
app.use("/about", routes.aboutRouter);
app.use("/admin", routes.adminRouter);
app.use("/api", routes.apiRouter);
app.use("/cgl-favorites", routes.cglFavoritesRouter);
app.use("/image", routes.imageRouter);
app.use("/login", routes.loginRouter);
app.use("/logout", routes.logoutRouter);
app.use("/password-reset", routes.passwordResetRouter);
app.use("/post", routes.postRouter);
app.use("/profile", routes.profileRouter);
app.use("/query", routes.queryRouter);
app.use("/register", routes.registerRouter);
app.use("/terms", routes.termsRouter);

// Error 404 (not found)
app.use((req, res) => {
  renderPage(req, res, "404", { title: "Not found" }, 404);
});

// Error 500 (internal server error)
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    renderError(err, req, res);
  }
);

// Create the database manager
const dbm = new DatabaseManager(dbURL);

// Initialize the database
initDB(dbm).then(() => {
  // Put the database manager in the app object
  app.set("dbm", dbm);

  // Listen for connections
  app.listen(port, () => {
    console.log(`App running on port ${port}`);
  });
});

// Export the express app
export = app;
