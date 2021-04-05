const suspensionTimeout = 60 * 1000; // One minute

// Suspend an account
function suspendAccount(event) {
  event.preventDefault();

  const userID = $(event.target.userID).val();
  const duration = $(event.target.duration).val();

  $.ajax({
    url: "/api/suspendAccount",
    data: {
      userID,
      duration,
    },
    success: () => {
      hideError();
      updateNotifications();
      populateSuspension();
    },
    error: () => {
      showError("Failed to suspend user account");
    },
  });
}

function endSuspension(suspensionID) {
  $.ajax({
    url: "/api/endSuspension",
    data: {
      suspensionID,
    },
    success: () => {
      hideError();
      updateNotifications();
      populateSuspension();
    },
    error: () => {
      showError("Failed to end user suspension");
    },
  });
  updateNotifications();
}

// Create a row in the suspended users table
function createSuspensionRow(user) {
  const suspensionID = newElement("td").text(user.suspensionID);
  const userID = newElement("td").text(user.id);
  const firstname = newElement("td").text(user.firstname);
  const lastname = newElement("td").text(user.lastname);
  const email = newElement("td").text(user.email);
  const status = newElement("td").text(user.status);
  const suspendedUntil = newElement("td").text(
    new Date(parseInt(user.suspendedUntil) * 1000).toLocaleString()
  );
  const endSuspensionButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-check"></i>')
    .click(() => {
      endSuspension(user.suspensionID);
    });
  const endSuspensionCell = newElement("td").append(endSuspensionButton);
  const row = newElement("tr").append(
    suspensionID,
    userID,
    firstname,
    lastname,
    email,
    status,
    suspendedUntil,
    endSuspensionCell
  );
  return row;
}

// Populate data on the suspension page
async function populateSuspension() {
  const suspensionURL = "/api/suspendedUsers";
  let suspended = null;

  try {
    suspended = await fetchJSON(suspensionURL);
  } catch (err) {
    showError("Failed to update suspended users");
  }

  if (suspended) {
    hideError();
    hideElement("suspended-status");
    clearElement("suspended");

    for (const user of suspended) {
      const newItem = createSuspensionRow(user);
      appendTo("suspended", newItem);
    }
  }
}

// Refresh all suspended users
async function refreshSuspended() {
  updateNotifications();
  clearElement("suspended");
  showElement("suspended-status");
  await populateSuspension();
}

// On suspension page load
function suspensionLoad() {
  updateNotifications();
  populateSuspension();

  setInterval(() => {
    updateNotifications();
    populateSuspension();
  }, suspensionTimeout);
}
