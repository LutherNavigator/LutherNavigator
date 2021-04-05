function populateForm() {
  let query = {};
  window.location.search
    .substr(1)
    .split("&")
    .forEach((item) => {
      query[item.split("=")[0]] = item.split("=")[1];
    });

  for (const item in query) {
    if (item === "search") {
      $(`#${item}`).val(decodeURIComponent(query[item].replace(/\+/g, "%20")));
    } else if (item === "sortBy" || item === "sortOrder") {
      $(`#${item}`).val(query[item]);
    } else {
      $(`#${item}`).prop("checked", true);
    }
  }
}

window.addEventListener("load", populateForm);
