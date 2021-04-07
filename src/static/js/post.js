// Upvote/un-upvote the post
function toggleUpvote() {
  const urlPath = new URL(window.location.href).pathname;
  const postID = urlPath.split("/")[2];

  $.ajax({
    url: "/api/toggleUpvotePost",
    data: {
      postID,
    },
  });

  const voted = $("#upvote.fas").length === 0;
  if (voted) {
    $("#upvote").removeClass("far").addClass("fas");
    const numUpvotes = parseInt($("#num-upvotes").text());
    $("#num-upvotes").text(numUpvotes + 1);
  } else {
    $("#upvote").removeClass("fas").addClass("far");
    const numUpvotes = parseInt($("#num-upvotes").text());
    $("#num-upvotes").text(numUpvotes - 1);
  }
}
