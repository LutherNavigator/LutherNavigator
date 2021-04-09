import { getDBM, closeDBM } from "./util";

// Test user status service
test("UserStatus", async () => {
  const dbm = await getDBM();

  // Get statuses
  const statuses = await dbm.userStatusService.getStatuses();
  expect(statuses).toEqual([
    { id: 1, name: "Student" },
    { id: 2, name: "Alum" },
    { id: 3, name: "Faculty/Staff" },
    { id: 4, name: "Parent" },
    { id: 1000, name: "Other" },
  ]);

  // Get status names
  let statusName = await dbm.userStatusService.getStatusName(1);
  expect(statusName).toBe("Student");
  statusName = await dbm.userStatusService.getStatusName(4);
  expect(statusName).toBe("Parent");
  statusName = await dbm.userStatusService.getStatusName(1000);
  expect(statusName).toBe("Other");
  statusName = await dbm.userStatusService.getStatusName(999);
  expect(statusName).toBe(undefined);

  // Check valid statuses
  let validStatus = await dbm.userStatusService.validStatus(2);
  expect(validStatus).toBe(true);
  validStatus = await dbm.userStatusService.validStatus(3);
  expect(validStatus).toBe(true);
  validStatus = await dbm.userStatusService.validStatus(999);
  expect(validStatus).toBe(false);

  await closeDBM(dbm);
});
