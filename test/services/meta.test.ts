import { getDBM, closeDBM } from "./util";

// Test meta service
test("Meta", async () => {
  const dbm = await getDBM();

  const key1 = "Test Version";
  const value1 = "0.1.0";
  const value1_2 = "1.2.3";
  const key2 = "Test Table";
  const value2 = "Meta";

  // Insert values
  await dbm.metaService.set(key1, value1);

  // Check values exists
  let valueExists = await dbm.metaService.exists(key1);
  expect(valueExists).toBe(true);

  // Get value
  let value = await dbm.metaService.get(key1);
  expect(value).toBe(value1);

  // Get missing value
  value = await dbm.metaService.get("Missing key");
  expect(value).toBeUndefined();

  // Set value
  await dbm.metaService.set(key1, value1_2);
  value = await dbm.metaService.get(key1);
  expect(value).toBe(value1_2);

  // Get all
  await dbm.metaService.set(key2, value2);
  const values = await dbm.metaService.getAll();
  expect(values).toContainEqual({ name: key2, value: value2 });
  expect(values).toContainEqual({ name: key1, value: value1_2 });

  // Remove
  await dbm.metaService.remove(key1);
  await dbm.metaService.remove(key2);

  // Check values are gone
  valueExists = await dbm.metaService.exists(key1);
  expect(valueExists).toBe(false);
  valueExists = await dbm.metaService.exists(key2);
  expect(valueExists).toBe(false);

  await closeDBM(dbm);
});
