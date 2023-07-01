/* eslint-disable react-hooks/exhaustive-deps */
// Import packages
import React, { useState, memo, useCallback, useRef } from "react"
import ReactDOM from "react-dom"
import {v4 as uuidv4} from "uuid"
import * as dotenv from "dotenv";

// Import local files
import { getInitialState, getBookDetails, patchGeneratingGiftsReducer, giftsReducer } from "./data/gifts"
import { useSocket } from "./hooks/useSocket"
import "./styles/index.css"

// Load environment variables
dotenv.config();

// Define websocket
const protocol = "ws://";
const hostname = window.location.hostname || "localhost";
const port = process.env.WEBSOCKET_PORT || "5001"
const url = `${protocol}${hostname}:${port}`;
// console.log("WebSocket URL:", url);

// Gift component
const Gift = memo(({ gift, users, currentUser, onReserve }) => (
  <div className={`gift ${gift.reservedBy ? "reserved" : ""}`}>
    <img src={gift.image} alt="gift" />
    <div className="description">
      <h2>{gift.description}</h2>
    </div>
    <div className="reservation">
      {!gift.reservedBy || gift.reservedBy === currentUser.id ? (
        <button onClick={() => onReserve(gift.id)}>{gift.reservedBy ? "Unreserve" : "Reserve"}</button>
      ) : (
        <span>{users[gift.reservedBy].name}</span>
      )}
    </div>
  </div>
))

// GiftList component
function GiftList() {
  // Define state
  const [state, setState] = useState(() => getInitialState())

  // Define refs for undo/redo
  const undoStack = useRef([])
  const undoStackPointer = useRef(-1)

  // Define conditions for undo/redo
  const undoNotPossible = undoStackPointer.current < 0;
  //// const undoPossible = undoStackPointer.current >= 0;
  const redoNotPossible = undoStackPointer.current === undoStack.current.length - 1;
  //// const redoPossible = undoStackPointer.current < undoStack.current.length - 1;

  // Destructure state
  const { users, gifts, currentUser } = state

  // Define dispatch
  const dispatch = useCallback((action, undoable = true) => {
    setState(currentState => {
      const [nextState, patches, inversePatches] = patchGeneratingGiftsReducer(currentState, action)
      send(patches) // always send patches
      if (undoable) {
        const pointer = ++undoStackPointer.current
        undoStack.current.length = pointer
        undoStack.current[pointer] = { patches, inversePatches }
      }
      return nextState
    })
  }, [])

  // Define send
  const send = useSocket(url, (patches) => {
      // we received some patches
      setState(state => giftsReducer(state, { type: "APPLY_PATCHES", patches }))
  })

  // Handle undo
  const handleUndo = () => {
    if (undoNotPossible) {
      return
    }
  
    if (!undoNotPossible) {
      const patches = undoStack.current[undoStackPointer.current].inversePatches
      dispatch({ type: "APPLY_PATCHES", patches }, false)
      undoStackPointer.current--
    }
  }

  // Handle redo
  const handleRedo = () => {
    if (redoNotPossible) { 
      return 
    }
    if (!redoNotPossible) {
      undoStackPointer.current++
      const patches = undoStack.current[undoStackPointer.current].patches
      dispatch({ type: "APPLY_PATCHES", patches }, false)
    }
  }

  // Handle add
  const handleAdd = () => {
    const randomNumber = Math.round(Math.random() * 1000)
    const description = prompt("Gift to add")
    if (!description || description === "") {
      return
    }
    if (description) {
      dispatch({
        type: "ADD_GIFT",
        id: uuidv4(),
        description,
        image: `https://picsum.photos/id/${randomNumber}/200/200`
      })
    }
  }

  // Handle add book
  const handleAddBook = async () => {
    const isbn = prompt("Enter ISBN number", "0201558025")
    if (!isbn || isbn === "") {
      alert("Please enter a valid ISBN number!")
      return
    }
    if (isbn) {
      const book = await getBookDetails(isbn)
      if (!book) {
        alert("Book not found!")
        return
      }
      if (book) {
        dispatch({
          type: "ADD_BOOK",
          book
        })
      }
    }
  }

  // Handle reserve
  const handleReserve = useCallback(id => {
    dispatch({
      type: "TOGGLE_RESERVATION",
      id
    })
  }, [])

  // Handle reset
  const handleReset = () => {
    dispatch({ type: "RESET" })
  }

  // Define gifts array i.e. the gifts object as an array without the ID's
  const giftsArray = Object.values(gifts)

  return (
    <div className="app">
      <div className="header">
        <h1>Hi, {currentUser.name}</h1>
      </div>
      <div className="actions">
        <button onClick={handleAdd}>Add</button>
        <button onClick={handleAddBook}>Add Book</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleUndo} disabled={undoNotPossible}>Undo</button>
        <button onClick={handleRedo} disabled={redoNotPossible}>Redo</button>
      </div>
      <div className="gifts">
        {giftsArray.map(gift => ( <Gift key={gift.id} gift={gift} users={users} currentUser={currentUser} onReserve={handleReserve} /> ))}
      </div>
    </div>
  )
}

// Render
ReactDOM.render(<GiftList />, document.getElementById("root"))
