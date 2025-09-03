process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// server.js (Backend)
const express = require("express");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- MongoDB Connection ----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ---------------- Email Schema ----------------
const emailSchema = new mongoose.Schema({
  from: String,
  subject: String,
  esp_type: String,
  receiving_chain: [String],
  date: { type: Date, default: Date.now }
});
const Email = mongoose.model("Email", emailSchema);

// ---------------- Helper Functions ----------------
function identifyESP(from, returnPath) {
  const f = (from || "").toLowerCase();
  const r = (returnPath || "").toLowerCase();
  if (f.includes("gmail.com") || r.includes("google.com")) return "Gmail";
  if (f.includes("outlook.com") || f.includes("hotmail.com")) return "Outlook";
  if (r.includes("sendgrid.net")) return "SendGrid";
  return "Unknown ESP";
}

// ---------------- Routes ----------------

// Fetch latest email via IMAP and save to MongoDB
app.get("/fetch-email", (req, res) => {
  const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.IMAP_HOST,
    port: 993,
    tls: true,
  });

  imap.once("ready", () => {
    imap.openBox("INBOX", true, (err, box) => {
      if (err) {
        console.error("OpenBox error:", err);
        return res.status(500).json({ error: err.message });
      }

      imap.search(["ALL"], (err, results) => {
        if (err) {
          console.error("Search error:", err);
          return res.status(500).json({ error: err.message });
        }

        if (!results || results.length === 0) {
          return res.status(404).json({ error: "No emails found" });
        }

        const latest = results.slice(-1);
        const f = imap.fetch(latest, { bodies: "" });

        f.on("message", (msg) => {
          msg.on("body", async (stream) => {
            try {
              const parsed = await simpleParser(stream);
              const chain = parsed.headers.get("received")
                ? [].concat(parsed.headers.get("received"))
                : [];

              const emailData = {
                from: parsed.from?.text || "",
                subject: parsed.subject || "",
                esp_type: identifyESP(parsed.from?.text, parsed.returnPath),
                receiving_chain: chain.reverse()
              };

              // Save to MongoDB
              const emailDoc = new Email(emailData);
              await emailDoc.save();

              res.json(emailData);
            } catch (parseErr) {
              console.error("Parsing error:", parseErr);
              res.status(500).json({ error: parseErr.message });
            }
          });
        });

        f.once("error", (fetchErr) => {
          console.error("Fetch error:", fetchErr);
          res.status(500).json({ error: fetchErr.message });
        });
      });
    });
  });

  imap.once("error", (err) => {
    console.error("IMAP error:", err);
    res.status(500).json({ error: err.message });
  });

  imap.connect();
});

// Get email history from MongoDB
app.get("/emails", async (req, res) => {
  try {
    const emails = await Email.find().sort({ date: -1 }).limit(20);
    res.json(emails);
  } catch (err) {
    console.error("Fetch history error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


