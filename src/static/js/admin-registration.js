const registrationTimeout = 60 * 1000; // One minute
let currentUserID = null;

// Set a user's approved status
function approveUser(userID, approved, reason) {
  $.ajax({
    url: "/api/approveRegistration",
    data: {
      userID,
      approved,
      reason,
    },
    success: () => {
      hideError();
      updateNotifications();
      populateRegistration();
    },
    error: () => {
      showError("Failed to approve/deny user account");
    },
  });
}

// Deny a user's account registration with a reason
function denyUser() {
  $("#denialReasonModal").modal("hide");
  const reason = $("#denial-reason").val();
  approveUser(currentUserID, false, reason);
}

// Create a row in the unapproved users table
function createUserRow(user) {
  const userID = newElement("td").text(user.userID);
  const firstname = newElement("td").text(user.firstname);
  const lastname = newElement("td").text(user.lastname);
  const email = newElement("td").text(user.email);
  const status = newElement("td").text(user.status);
  const joinTime = newElement("td").text(
    new Date(parseInt(user.joinTime) * 1000).toLocaleString()
  );
  const approveButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-check"></i>')
    .click(() => {
      approveUser(user.userID, true, "");
    });
  const denyButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-times"></i>')
    .click(() => {
      currentUserID = user.userID;
      $("#denialReasonModal").modal("show");
    });
  const approve = newElement("td")
    .addClass("nowrap")
    .append(approveButton, denyButton);
  const row = newElement("tr").append(
    userID,
    firstname,
    lastname,
    email,
    status,
    joinTime,
    approve
  );
  return row;
}

// Populate data on the registration approval page
async function populateRegistration() {
  const registrationURL = "/api/unapprovedUsers";
  let unapproved = null;

  try {
    unapproved = await fetchJSON(registrationURL);
  } catch (err) {
    showError("Failed to update users");
  }

  if (unapproved) {
    hideError();
    hideElement("registration-status");
    clearElement("unapproved-registration");

    for (const user of unapproved) {
      const newItem = createUserRow(user);
      appendTo("unapproved-registration", newItem);
    }
  }
}

// Refresh unapproved users
async function refreshRegistration() {
  updateNotifications();
  clearElement("unapproved-registration");
  showElement("registration-status");
  await populateRegistration();
}

// On registration approval page load
function registrationLoad() {
  updateNotifications();
  populateRegistration();

  setInterval(() => {
    updateNotifications();
    populateRegistration();
  }, registrationTimeout);
}
