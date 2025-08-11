const resultDiv = document.getElementById('result');
const codesScannés = new Set();

function afficherRésultat(code, statut) {
  if (statut === "valide") {
    resultDiv.innerHTML = "✅ <span class='valide'>Valide</span><br>" + code;
  } else if (statut === "fraude") {
    resultDiv.innerHTML = "❌ <span class='fraude'>Fraude</span><br>" + code;
  }
}

function onScanSuccess(decodedText, decodedResult) {
  if (codesScannés.has(decodedText)) {
    const estFraude = confirm("⚠️ Ce code a déjà été scanné.\nEst-ce une fraude ?");
    if (estFraude) {
      afficherRésultat(decodedText, "fraude");
    } else {
      afficherRésultat(decodedText, "valide");
    }
  } else {
    codesScannés.add(decodedText);
    afficherRésultat(decodedText, "valide");
  }
}

function onScanFailure(error) {
  // Ignoré pour éviter le spam
}

const html5QrCode = new Html5Qrcode("reader");
html5QrCode.start(
  { facingMode: "environment" },
  {
    fps: 10,
    qrbox: { width: 250, height: 250 }
  },
  onScanSuccess,
  onScanFailure
);
