// Import the list of all users
import allUsers from "./users.json"
  
// Gets the current user from the session storage
export function getCurrentUser() {
	// If we're not in a browser, ...
	if (typeof sessionStorage === "undefined") {
		// Create a test user
		const testUser = { id: "-1", name: "Test" }
		// Return a test user
		return testUser
	}
  
	// If we are in a browser, ...
	if (typeof sessionStorage !== "undefined") {  
		// Retrieve the user from session storage (if it exists) or pick a random user from the list
		const currentUserId = sessionStorage.getItem("user") || pickRandomUserId(allUsers)
		// Save the user to session storage
		sessionStorage.setItem("user", currentUserId)
		// Find the current user in the list of all users
		const currentUser = allUsers.find(user => user.id === currentUserId)
		// Return the user
		return currentUser
	}
}

// Pick a random user id from the list
export function pickRandomUserId(array) {
	// Pick a random user id from the list
	const randomUserId = (Math.round(Math.random() * (array.length - 1))).toString()

	// Return the random user id
	return randomUserId
}
