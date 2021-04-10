import { getDBM, closeDBM } from "./util";
import * as crypto from "crypto";
import { getTime } from "../../src/services/util";

// Test image service
test("Image", async () => {
  const dbm = await getDBM();

  const len = Math.floor(Math.random() * 63) + 1;
  const buf = crypto.randomBytes(len);

  // Create image
  const imageID = await dbm.imageService.createImage(buf);
  expect(imageID.length).toBe(4);

  // Check image exists
  let imageExists = await dbm.imageService.imageExists(imageID);
  expect(imageExists).toBe(true);

  // Get image
  let image = await dbm.imageService.getImage(imageID);
  expect(image.id).toBe(imageID);
  expect(image.data.toString()).toBe(buf.toString());
  expect(getTime() - image.registerTime).toBeLessThanOrEqual(3);

  // Get missing image
  image = await dbm.imageService.getImage("!!!!");
  expect(image).toBe(undefined);

  // Delete image
  await dbm.imageService.deleteImage(imageID);

  // Check image is gone
  imageExists = await dbm.imageService.imageExists(imageID);
  expect(imageExists).toBe(false);

  await closeDBM(dbm);
});
