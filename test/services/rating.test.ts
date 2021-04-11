import { getDBM, closeDBM } from "./util";

// Test rating service
test("Rating", async () => {
  const dbm = await getDBM();

  const rating = {
    general: 1,
    cost: 3,
    safety: 5,
  };

  // Create rating
  const ratingID = await dbm.ratingService.createRating(rating);
  expect(ratingID.length).toBe(4);

  // Check rating exists
  let ratingExists = await dbm.ratingService.ratingExists(ratingID);
  expect(ratingExists).toBe(true);

  // Get rating
  let rating2 = await dbm.ratingService.getRating(ratingID);
  expect(rating2).toEqual({
    id: ratingID,
    general: rating.general,
    cost: rating.cost,
    quality: null,
    safety: rating.safety,
    cleanliness: null,
    guestServices: null,
  });

  // Get missing rating
  rating2 = await dbm.ratingService.getRating("!!!!");
  expect(rating2).toBe(undefined);

  // Delete rating
  await dbm.ratingService.deleteRating(ratingID);

  // Check rating is gone
  ratingExists = await dbm.ratingService.ratingExists(ratingID);
  expect(ratingExists).toBe(false);

  await closeDBM(dbm);
});
