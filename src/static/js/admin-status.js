const statusesTimeout = 60 * 1000; // One minute

// Approve or deny a user status change request
function approveStatus(requestID, approved) {
  $.ajax({
    url: "/api/approveStatusChangeRequest",
    data: {
      requestID,
      approved,
    },
    success: () => {
      hideError();
      populateStatuses();
    },
    error: () => {
      showError("Failed to approve/deny status change request");
    },
  });
}

// Create a row in the user status change request table
function createStatusRow(user) {
  const userID = newElement("td").text(user.userID);
  const firstname = newElement("td").text(user.firstname);
  const lastname = newElement("td").text(user.lastname);
  const email = newElement("td").text(user.email);
  const currentStatus = newElement("td").text(user.status);
  const requestedStatus = newElement("td").text(user.newStatus);
  const approveButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-check"></i>')
    .click(function () {
      approveStatus(user.requestID, true);
    });
  const disapproveButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-times"></i>')
    .click(function () {
      approveStatus(user.requestID, false);
    });
  const approve = newElement("td")
    .addClass("nowrap")
    .append(approveButton, disapproveButton);
  const row = newElement("tr").append(
    userID,
    firstname,
    lastname,
    email,
    currentStatus,
    requestedStatus,
    approve
  );
  return row;
}

// Populate data on the user status change requests page
async function populateStatuses() {
  const statusesURL = "/api/statusChangeRequests";
  let statuses = null;

  try {
    statuses = await fetchJSON(statusesURL);
  } catch (err) {
    showError("Failed to update status change requests");
  }

  if (statuses) {
    hideError();
    hideElement("status-status");
    clearElement("requested-statuses");

    for (const user of statuses) {
      const newItem = createStatusRow(user);
      appendTo("requested-statuses", newItem);
    }
  }
}

// Refresh all user status change requests
async function refreshStatuses() {
  updateNotifications();
  clearElement("requested-statuses");
  showElement("status-status");
  await populateStatuses();
}

// On user status request change page load
function statusLoad() {
  populateStatuses();

  setInterval(() => {
    populateStatuses();
  }, statusesTimeout);
}
