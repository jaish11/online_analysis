const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const WebSocket = require("ws");
const http = require("http");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(
  "mongodb+srv://jaish786:Jaish786@cluster0.0ie4hum.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

// Schema
const eventSchema = new mongoose.Schema({
  eventId: { type: String, default: uuidv4 },
  userId: String,
  page: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
});

const Event = mongoose.model("Event", eventSchema);

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Broadcast function to all WebSocket clients
function broadcastEvent(event) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "NEW_EVENT",
          data: event,
        })
      );
    }
  });
}

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Analytics API");
});

app.post("/api/events", async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();

    // Broadcast to all WebSocket clients
    broadcastEvent(event);

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to log event" });
  }
});

app.get("/api/analytics", async (req, res) => {
  try {
    const events = await Event.find(req.query);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/analytics/realtime", async (req, res) => {
  try {
    const events = await Event.find().sort({ timestamp: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch realtime analytics" });
  }
});

// Start Server
server.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
  console.log("WebSocket server running on ws://localhost:5000");
});
