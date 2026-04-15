const express = require("express");
const router = express.Router();

// Connected SSE clients
const clients = [];

// SSE endpoint — clients connect here for real-time updates
router.get("/", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: "connected", message: "SSE connected" })}\n\n`);

  clients.push(res);
  console.log(`📡 SSE client connected (total: ${clients.length})`);

  req.on("close", () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
    console.log(`📡 SSE client disconnected (total: ${clients.length})`);
  });
});

/**
 * Broadcast an event to all connected SSE clients
 * @param {string} eventType - e.g. 'price-update', 'discount-update'
 * @param {object} data - payload to send
 */
function broadcast(eventType, data) {
  const payload = JSON.stringify({ type: eventType, ...data, timestamp: Date.now() });
  clients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
}

module.exports = { router, broadcast };
