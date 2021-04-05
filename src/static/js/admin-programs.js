const programsTimeout = 60 * 1000; // One minute

// Create a new program
function createProgram(programName) {
  $.ajax({
    url: "/api/createProgram",
    data: {
      programName,
    },
    success: () => {
      hideError();
      updateNotifications();
      populatePrograms();
    },
    error: () => {
      showError("Failed to create program");
    },
  });
}

// Set a program
function setProgram(programID, programName) {
  $.ajax({
    url: "/api/setProgram",
    data: {
      programID,
      programName,
    },
    success: (err) => {
      if (err) {
        showError(err);
      } else {
        hideError();
        updateNotifications();
      }
    },
    error: () => {
      showError("Failed to set program");
    },
  });
}

// Delete a program
function deleteProgram(programID) {
  $.ajax({
    url: "/api/deleteProgram",
    data: {
      programID,
    },
    success: (err) => {
      if (err) {
        showError(err);
      } else {
        hideError();
        updateNotifications();
        populatePrograms();
      }
    },
    error: () => {
      showError("Failed to delete program");
    },
  });
}

// Create a new program element
function createProgramRow(program) {
  const progName = newElement("input")
    .addClass("form-control")
    .attr({
      type: "text",
      id: `prog-${program.id}`,
      name: "value",
      value: program.name,
    });
  const progNameDiv = newElement("div").addClass("col").append(progName);
  const progSaveButton = newElement("button")
    .addClass("btn btn-primary mr-1")
    .attr({
      type: "submit",
    })
    .text("Save");
  const progDeleteButton = newElement("button")
    .addClass("btn btn-danger")
    .attr({
      type: "button",
    })
    .text("Delete")
    .click(() => {
      deleteProgram(program.id);
    });
  const progButtonDiv = newElement("div")
    .addClass("col-auto flex-end")
    .append(progSaveButton, progDeleteButton);
  const row = newElement("div")
    .addClass("row mt-3")
    .append(progNameDiv, progButtonDiv);
  const form = newElement("form")
    .append(row)
    .submit((event) => {
      event.preventDefault();
      setProgram(program.id, $(event.target.value).val());
    });
  return form;
}

// Populate data on the programs page
async function populatePrograms() {
  const programsURL = "/api/adminPrograms";
  let programs = null;

  try {
    programs = await fetchJSON(programsURL);
  } catch (err) {
    showError("Failed to update programs");
  }

  if (programs) {
    hideError();
    clearElement("programs");

    for (const program of programs) {
      const newItem = createProgramRow(program);
      appendTo("programs", newItem);
    }

    const newProgramButton = newElement("button")
      .addClass("btn btn-primary")
      .attr({
        type: "button",
      })
      .text("New Program")
      .click(() => {
        createProgram("");
      });
    const newProgramButtonDiv = newElement("div")
      .addClass("row mt-3")
      .append(newProgramButton);
    appendTo("programs", newProgramButtonDiv);
  }
}

// Refresh all programs
async function refreshPrograms() {
  updateNotifications();
  clearElement("programs");
  appendTo("programs", "Fetching programs...");
  await populatePrograms();
}

// On programs page load
function programsLoad() {
  populatePrograms();

  setInterval(() => {
    populatePrograms();
  }, programsTimeout);
}
