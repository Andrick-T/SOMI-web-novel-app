const student = {
  name: "andrick",
  age: 22,
  dept: "swe",
  location: {
    city: "Yaounde",
    neigborhood: "Damase",
  },
  scores: [80, 50, 75, 72, 34],
};

const display = ({ location: { neigborhood }, scores: [, , third] }) => {
  console.log(`
        Hello ! You live in ${neigborhood}.
        Your english scores are ${third}
        `);
};

display(student);

const names = ["Andrick", "John", "Alice"].find;

async function loadUserPosts(userId) {
  try {
    const res = await fetch(`/users/${userId}`);
    const user = await res.json();
    const postsRes = await fetch(`/posts?userId=${user.id}`);
    const posts = await postsRes.json();
    renderPosts(posts);
  } catch (err) {
    showError(err);
  }
}
