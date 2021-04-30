import { getDBM, closeDBM } from "./util";

// Test location type service
test("LocationType", async () => {
  const dbm = await getDBM();

  // Get locations
  const locations = await dbm.locationTypeService.getLocations();
  expect(locations).toEqual([
    { id: 1, name: "Hotel" },
    { id: 2, name: "Hostel" },
    { id: 3, name: "B&B/Inn" },
    { id: 4, name: "Cafe/Bakery" },
    { id: 5, name: "Bar/Pub" },
    { id: 6, name: "Restaurant" },
    { id: 7, name: "Museum" },
    { id: 8, name: "Arts venue" },
    { id: 9, name: "Sports venue" },
    { id: 10, name: "Cultural attraction" },
    { id: 11, name: "Historical attraction" },
    { id: 12, name: "Outdoor attraction" },
    { id: 1000, name: "Other" },
  ]);

  // Get location name
  let locationName = await dbm.locationTypeService.getLocationName(1);
  expect(locationName).toBe("Hotel");
  locationName = await dbm.locationTypeService.getLocationName(11);
  expect(locationName).toBe("Historical attraction");
  locationName = await dbm.locationTypeService.getLocationName(1000);
  expect(locationName).toBe("Other");
  locationName = await dbm.locationTypeService.getLocationName(999);
  expect(locationName).toBe(undefined);

  // Check valid locations
  let validLocation = await dbm.locationTypeService.validLocation(2);
  expect(validLocation).toBe(true);
  validLocation = await dbm.locationTypeService.validLocation(10);
  expect(validLocation).toBe(true);
  validLocation = await dbm.locationTypeService.validLocation(999);
  expect(validLocation).toBe(false);

  await closeDBM(dbm);
});
