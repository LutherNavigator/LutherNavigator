// Set a variable
function setVariable(name, value) {
  $.ajax({
    url: "/api/setVariable",
    data: {
      name,
      value,
    },
    success: () => {
      hideError();
      updateNotifications();
      populateVariables();
    },
    error: () => {
      showError("Failed to set variable");
    },
  });
}

// Reset a variable
function resetVariable(name) {
  $.ajax({
    url: "/api/resetVariable",
    data: {
      name,
    },
    success: () => {
      hideError();
      updateNotifications();
      populateVariables();
    },
    error: () => {
      showError("Failed to reset variable");
    },
  });
}

// Create a new variable element
function createVariable(variable) {
  const varName = newElement("span").text(variable.name);
  const varNameDiv = newElement("div")
    .addClass("col-4 col-sm-3 col-md-2")
    .append(varName);
  const varValue = newElement("input")
    .addClass("form-control")
    .attr({
      type: "text",
      id: `var-${replaceSpaces(variable.name)}`,
      name: "value",
      value: variable.value,
    });
  const varValueDiv = newElement("div").addClass("col").append(varValue);
  const varSaveButton = newElement("button")
    .addClass("btn btn-primary mr-1")
    .attr({
      type: "submit",
    })
    .text("Save");
  const varResetButton = newElement("button")
    .addClass("btn btn-danger")
    .attr({
      type: "button",
    })
    .text("Reset")
    .click(() => {
      resetVariable(variable.name);
    });
  const varButtonDiv = newElement("div")
    .addClass("col-auto flex-end")
    .append(varSaveButton, varResetButton);
  const row = newElement("div")
    .addClass("row mt-3")
    .append(varNameDiv, varValueDiv, varButtonDiv);
  const form = newElement("form")
    .append(row)
    .submit((event) => {
      event.preventDefault();
      setVariable(variable.name, $(event.target.value).val());
    });
  return form;
}

// Populate data on the variables page
async function populateVariables() {
  const variablesURL = "/api/adminVariables";
  let variables = null;

  try {
    variables = await fetchJSON(variablesURL);
  } catch (err) {
    showError("Failed to update variables");
  }

  if (variables) {
    hideError();
    clearElement("variables");

    for (const variable of variables) {
      const newItem = createVariable(variable);
      appendTo("variables", newItem);
    }
  }
}

// Refresh all variables
async function refreshVariables() {
  updateNotifications();
  clearElement("variables");
  appendTo("variables", "Fetching variables...");
  await populateVariables();
}

// On variables page load
function variablesLoad() {
  updateNotifications();
  populateVariables();
}
