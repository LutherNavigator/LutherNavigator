const postsTimeout = 60 * 1000; // One minute
let currentPostID = null;

// Set a post's approved status
function approvePost(postID, approved, reason) {
  $.ajax({
    url: "/api/approvePost",
    data: {
      postID,
      approved,
      reason,
    },
    success: () => {
      hideError();
      updateNotifications();
      populatePosts();
    },
    error: () => {
      showError("Failed to approve/deny post");
    },
  });
}

// Deny a post with a reason
function denyPost() {
  $("#denialReasonModal").modal("hide");
  const reason = $("#denial-reason").val();
  approvePost(currentPostID, false, reason);
}

// Create a row in the unapproved posts table
function createPostRow(post) {
  const postLink = newElement("a")
    .attr({
      href: `/post/${post.postID}`,
    })
    .text(post.postID);
  const postID = newElement("td").append(postLink);
  const user = newElement("td").text(`${post.firstname} ${post.lastname}`);
  const location = newElement("td").text(post.location);
  const city = newElement("td").text(post.city);
  const country = newElement("td").text(post.country);
  const locationType = newElement("td").text(post.locationType);
  const program = newElement("td").text(post.program);
  const threeWords = newElement("td").text(post.threeWords);
  const createTime = newElement("td").text(
    new Date(parseInt(post.createTime) * 1000).toLocaleString()
  );
  const approveButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-check"></i>')
    .click(() => {
      approvePost(post.postID, true, "");
    });
  const disapproveButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-times"></i>')
    .click(() => {
      currentPostID = post.postID;
      $("#denialReasonModal").modal("show");
    });
  const approve = newElement("td")
    .addClass("nowrap")
    .append(approveButton, disapproveButton);
  const row = newElement("tr").append(
    postID,
    user,
    location,
    city,
    country,
    locationType,
    program,
    threeWords,
    createTime,
    approve
  );
  return row;
}

// Populate data on the post approval page
async function populatePosts() {
  const postsURL = "/api/unapprovedPosts";
  let unapproved = null;

  try {
    unapproved = await fetchJSON(postsURL);
  } catch (err) {
    showError("Failed to update posts");
  }

  if (unapproved) {
    hideError();
    hideElement("posts-status");
    clearElement("unapproved-posts");

    for (const post of unapproved) {
      const newItem = createPostRow(post);
      appendTo("unapproved-posts", newItem);
    }
  }
}

// Refresh unapproved posts
async function refreshPosts() {
  updateNotifications();
  clearElement("unapproved-posts");
  showElement("posts-status");
  await populatePosts();
}

// On post approval page load
function postsLoad() {
  populatePosts();

  setInterval(() => {
    populatePosts();
  }, postsTimeout);
}
