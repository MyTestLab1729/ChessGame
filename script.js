import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm';
import SimplePeer from 'https://cdn.jsdelivr.net/npm/simple-peer@9.11.1/+esm';

const boardEl = document.getElementById("board");
const yourSignalBox = document.getElementById("yourSignal");
const friendSignalBox = document.getElementById("friendSignal");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const connectBtn = document.getElementById("connectBtn");

let chess = new Chess();
let peer;
let connEstablished = false;
let selected = null;

function renderBoard() {
  boardEl.innerHTML = "";
  const board = chess.board();
  board.forEach((row, y) => {
    row.forEach((square, x) => {
      const sq = document.createElement("div");
      sq.className = `square ${(x + y) % 2 === 0 ? "light" : "dark"}`;
      sq.dataset.x = x;
      sq.dataset.y = y;
      sq.innerText = square ? square.symbol : "";
      sq.onclick = () => onSquareClick(x, y);
      boardEl.appendChild(sq);
    });
  });
}

function onSquareClick(x, y) {
  const file = String.fromCharCode(97 + x);
  const rank = 8 - y;
  const square = file + rank;
  if (!selected) {
    if (chess.get(square)) selected = square;
  } else {
    const move = { from: selected, to: square, promotion: "q" };
    const result = chess.move(move);
    if (result) {
      renderBoard();
      if (connEstablished) peer.send(JSON.stringify({ type: "move", move }));
    }
    selected = null;
  }
}

function createGame() {
  peer = new SimplePeer({ initiator: true, trickle: false });
  setupPeerEvents();
}

function joinGame() {
  peer = new SimplePeer({ initiator: false, trickle: false });
  setupPeerEvents();
}

function connectPeers() {
  const signal = friendSignalBox.value;
  if (signal) {
    try {
      peer.signal(JSON.parse(signal));
    } catch (e) {
      alert("Invalid signal data.");
    }
  }
}

function setupPeerEvents() {
  peer.on("signal", data => {
    yourSignalBox.value = JSON.stringify(data);
    yourSignalBox.style.background = "#e0ffe0";
  });

  peer.on("connect", () => {
    connEstablished = true;
    alert("✅ Connected to opponent! Start playing.");
  });

  peer.on("error", err => {
    console.error("❌ Peer error:", err);
    alert("Peer connection error. Check console.");
  });

  peer.on("data", data => {
    const msg = JSON.parse(data);
    if (msg.type === "move") {
      chess.move(msg.move);
      renderBoard();
    }
  });
}

createBtn.addEventListener("click", createGame);
joinBtn.addEventListener("click", joinGame);
connectBtn.addEventListener("click", connectPeers);

window.addEventListener("DOMContentLoaded", () => {
  renderBoard();
});
