import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [email, setEmail] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchEmail = async () => {
    const res = await axios.get("http://localhost:5000/fetch-email");
    setEmail(res.data);
    fetchHistory(); // update history
  };

  const fetchHistory = async () => {
    const res = await axios.get("http://localhost:5000/emails");
    setHistory(res.data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Email Analyzer with History</h1>
      <button onClick={fetchEmail}>Fetch Latest Email</button>

      {email && (
        <div style={{ marginTop: "20px" }}>
          <h3>Latest Email</h3>
          <p><strong>From:</strong> {email.from}</p>
          <p><strong>Subject:</strong> {email.subject}</p>
          <p><strong>ESP Type:</strong> {email.esp_type}</p>
          <p><strong>Receiving Chain:</strong></p>
          <ol>{email.receiving_chain.map((hop, idx) => <li key={idx}>{hop}</li>)}</ol>
        </div>
      )}

      <div style={{ marginTop: "40px" }}>
        <h3>Email History</h3>
        {history.map((e, idx) => (
          <div key={idx} style={{ borderBottom: "1px solid #ccc", marginBottom: "10px" }}>
            <p><strong>From:</strong> {e.from}</p>
            <p><strong>Subject:</strong> {e.subject}</p>
            <p><strong>ESP Type:</strong> {e.esp_type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

