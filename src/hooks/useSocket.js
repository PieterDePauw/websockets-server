import { useEffect, useCallback, useRef } from "react"

/**
 * A custom hook that creates a WebSocket connection and returns a function to send data through the socket.
 * @param {string} url - The URL of the WebSocket server.
 * @param {function} onMessage - A callback function to handle incoming messages.
 * @returns {function} - A function to send data through the socket.
 */
export function useSocket(url, onMessage) {
  const socket = useRef() // Create a ref to hold the WebSocket connection.
  const msgHandler = useRef() // Create a ref to hold the onMessage callback.
  msgHandler.current = onMessage // Update the msgHandler ref with the onMessage callback.

  useEffect(() => {
    const createdSocket = new WebSocket(url) // Create a new WebSocket connection.
    createdSocket.onmessage = event => { // Set up a callback for incoming messages.
      const data = JSON.parse(event.data) // Parse the incoming message data as JSON.
      msgHandler.current(data) // Call the onMessage callback with the parsed data.
    }
    socket.current = createdSocket // Update the socket ref with the new WebSocket connection.
    console.log("created socket to " + url)
    return () => {
      console.log("socket disconnected")
      createdSocket.close() // Close the WebSocket connection when the component unmounts.
    }
  }, [url])

  return useCallback(data => {
    socket.current.send(JSON.stringify(data)) // Send data through the WebSocket connection.
  }, [])
}
