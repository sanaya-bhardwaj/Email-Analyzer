process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const Imap = require("imap");

const imap = new Imap({
  user: "sanayabhardwaj3@gmail.com",           // Gmail address
  password: "gvjz ssof ibbv qjdj",  // Gmail App Password
  host: "imap.gmail.com",
  port: 993,
  tls: true,
});

imap.once("ready", () => console.log("IMAP ready"));
imap.once("error", (err) => console.error("IMAP error:", err));
imap.connect();
