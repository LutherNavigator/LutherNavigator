const postsTimeout = 60 * 1000; // One minute

// Set a post's approved status
function approvePost(postID, approved) {
  $.ajax({
    url: "/api/approvePost",
    data: {
      postID,
      approved,
    },
    success: () => {
      hideError();
      populatePosts();
    },
    error: () => {
      showError("Failed to approve/deny post");
    },
  });
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
  const locationType = newElement("td").text(post.locationType);
  const program = newElement("td").text(post.program);
  const threeWords = newElement("td").text(post.threeWords);
  const content = newElement("td").text(post.content);
  const createTime = newElement("td").text(
    new Date(parseInt(post.createTime) * 1000).toLocaleString()
  );
  const approveButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-check"></i>')
    .click(function () {
      approvePost(post.postID, true);
    });
  const disapproveButton = newElement("button")
    .addClass("btn btn-light")
    .attr({
      type: "button",
    })
    .html('<i class="fas fa-times"></i>')
    .click(function () {
      approvePost(post.postID, false);
    });
  const approve = newElement("td")
    .addClass("nowrap")
    .append(approveButton, disapproveButton);
  const row = newElement("tr").append(
    postID,
    user,
    location,
    locationType,
    program,
    threeWords,
    content,
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
