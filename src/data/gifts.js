/* eslint-disable default-case */
import produce, { produceWithPatches, applyPatches } from "immer"
import { getCurrentUser } from "./users"
import allUsers from "./users.json"
import allGifts from "./gifts.json"

export const giftsRecipe = (draft, action) => {
  switch (action.type) {
    case "ADD_GIFT":
      const { id, description, image } = action
      draft.gifts[id] = {
        id,
        description,
        image,
        reservedBy: undefined
      }
      break
    case "TOGGLE_RESERVATION":
      const gift = draft.gifts[action.id]
      gift.reservedBy =
        // if reservedBy is undefined, reserve it for the current user (if the current user clicks on an item that is not reserved, reserve it)
        gift.reservedBy === undefined ? draft.currentUser.id :
          // if reservedBy is the id of the current user, unreserve it (if the current user clicks on an item that they have already reserved, unreserve it)
          gift.reservedBy === draft.currentUser.id ? undefined :
            // otherwise, if reservedBy is the id of another user, keep it reserved for that user (if the current user clicks on an item that is reserved by another user, do nothing)
            gift.reservedBy
      break
    case "ADD_BOOK":
      const { book } = action
      const isbn = book.identifiers.isbn_10[0]
      draft.gifts[isbn] = {
        id: isbn,
        description: book.title,
        image: book.cover.medium,
        reservedBy: undefined
      }
      break
    case "RESET":
      draft.gifts = getInitialState().gifts
      break
    case "APPLY_PATCHES":
      if (!action.patches) { throw new Error("No patches provided for APPLY_PATCHES action.") }
      return applyPatches(draft, action.patches);
  }
}

// Gifts reducer with and without patches (for undo/redo)
export const giftsReducer = produce(giftsRecipe)
export const patchGeneratingGiftsReducer = produceWithPatches(giftsRecipe)

// Helper function to get book details from OpenLibrary API
export async function getBookDetails(isbn) {
  try {
    const response = await fetch(`http://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`, { "mode": "cors" });
    const book = (await response.json())["ISBN:" + isbn];
    return book;
  } catch (error) {
    console.error(`Failed to fetch book details for ISBN ${isbn}:`, error);
    return null;
  }
}

// Helper function to get the initial state
export function getInitialState() {
  return {
    "users": allUsers,
    "gifts": allGifts,
    "currentUser": getCurrentUser()
  }
}
