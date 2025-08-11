const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const uniqueCountEl = document.getElementById("uniqueCount");
const duplicateCountEl = document.getElementById("duplicateCount");
const fraudCountEl = document.getElementById("fraudCount");
const history = document.getElementById("history");
const scanButton = document.getElementById("scanButton");
const stopButton = document.getElementById("stopButton");
const popup = document.getElementById("popup");
const popupText = document.getElementById("popupText");

let scanned = new Set();
let scanTimes = new Map();
let uniqueCount = 0;
let duplicateCount = 0;
let fraudCount = 0;
let scanActive = false;
let currentQR = "";
let lastDetectedQR = "";
let lastDetectionTime = 0;

const errorSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
const successSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
  .then(stream => {
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.play();
  })
  .catch(err => {
    alert("🚫 Erreur caméra : " + err);
  });

function startScan() {
  if (scanActive) return;
  scanActive = true;
  scanButton.style.display = "none";
  scanLoop();
}

function stopScan() {
  scanActive = false;
  scanButton.style.display = "block";
}

function scanLoop() {
  if (!scanActive) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    const now = Date.now();

    if (code) {
      const qr = code.data;

      if (qr === lastDetectedQR && now - lastDetectionTime < 1000) {
        requestAnimationFrame(scanLoop);
        return;
      }

      lastDetectedQR = qr;
      lastDetectionTime = now;
      currentQR = qr;
      const timestamp = new Date(now).toLocaleTimeString();

      if (!scanned.has(qr)) {
        scanned.add(qr);
        scanTimes.set(qr, now);
        uniqueCount++;
        uniqueCountEl.textContent = uniqueCount;

        const li = document.createElement("li");
        li.textContent = `${qr} — ${timestamp}`;
        li.style.color = "green";
        history.appendChild(li);

        successSound.play();
        if (navigator.vibrate) navigator.vibrate([100]);
        scanButton.style.backgroundColor = "#2e7d32";
        scanButton.textContent = "✅ QR OK — SCAN";
      } else {
        duplicateCount++;
        duplicateCountEl.textContent = duplicateCount;

        errorSound.play();
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        scanButton.style.backgroundColor = "#b71c1c";
        scanButton.textContent = "🔁 Doublon — SCAN";

        const firstScan = scanTimes.get(qr);
        const delay = Math.floor((now - firstScan) / 1000);
        const firstStr = new Date(firstScan).toLocaleTimeString();
        const nowStr = new Date(now).toLocaleTimeString();

        const msg = `🔁 Doublon détecté\n\n🕒 Premier scan : ${firstStr}\n🕓 Heure actuelle : ${nowStr}\n⏱️ Délai : ${delay} sec\n\n⚠️ Confirmer la fraude ?`;
        showPopup(msg);
      }
    }

    requestAnimationFrame(scanLoop);
  } else {
    setTimeout(() => requestAnimationFrame(scanLoop), 100);
  }
}

function showPopup(message) {
  popupText.innerText = message;
  popup.style.display = "block";
}

function markFraud(isFraud) {
  const timestamp = new Date().toLocaleTimeString();
  const li = document.createElement("li");
  li.textContent = `⚠️ ${isFraud ? "FRAUDE" : "Pas de fraude"} — ${currentQR} — ${timestamp
