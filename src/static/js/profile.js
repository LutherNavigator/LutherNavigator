$(document).ready(() => {
  // Replace the file input label with the file name
  $("#image").on("change", function () {
    var fileName = $(this).val().replace("C:\\fakepath\\", "");
    $(this).next(".custom-file-label").html(fileName);
  });
});
