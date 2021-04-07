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
}
