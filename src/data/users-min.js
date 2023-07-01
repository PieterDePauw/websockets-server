import allUsers from "./users.json";

export function getCurrentUser() {
  try {
    if (typeof sessionStorage !== "undefined") {
      const currentUserId = sessionStorage.getItem("user") || pickRandomUserId(allUsers);
      sessionStorage.setItem("user", currentUserId);
      const currentUser = allUsers.find(user => user.id === currentUserId);
      return currentUser;
    }
    return { id: "-1", name: "Test" };
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

export function pickRandomUserId(array) {
  const randomUserId = (Math.round(Math.random() * (array.length - 1))).toString();
  return randomUserId;
}
