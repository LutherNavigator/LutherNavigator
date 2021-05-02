$(document).ready(() => {
  // Replace the file input label with the file names
  $("#images").on("change", function () {
    let fileNames = [];

    for (const file of this.files) {
      fileNames.push(file.name.replace("C:\\fakepath\\", ""));
    }

    $(this).next(".custom-file-label").html(fileNames.join(", "));
  });
});
