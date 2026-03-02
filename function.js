const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

const inputCount = 2;
const hiddenCount = 4;
const outputCount = 2;

let hiddenWeights = Array.from({length: hiddenCount}, () => [Math.random(), Math.random()]);
let outputWeights = Array.from({length: outputCount}, () => Array(hiddenCount).fill().map(() => Math.random()));

const learningRate = 0.1;

// LocalStorage yükleme
function loadWeights() {
  const h = localStorage.getItem("hiddenWeights");
  const o = localStorage.getItem("outputWeights");
  if (h && o) {
    hiddenWeights = JSON.parse(h);
    outputWeights = JSON.parse(o);
  }
}

// LocalStorage kaydetme
function saveWeights() {
  localStorage.setItem("hiddenWeights", JSON.stringify(hiddenWeights));
  localStorage.setItem("outputWeights", JSON.stringify(outputWeights));
}

function forwardPass(inp) {
  let hidden = hiddenWeights.map(w => w[0]*inp[0] + w[1]*inp[1]);
  let output = outputWeights.map(w => w.reduce((sum, weight, i) => sum + weight*hidden[i], 0));
  return {hidden, output};
}

function train() {
  const inputValues = getInputValues();
  const targetValues = getTargetValues();
  const {hidden, output} = forwardPass(inputValues);

  let error = targetValues.map((t, i) => t - output[i]);

  // Output weight güncelle
  for (let i = 0; i < outputWeights.length; i++) {
    for (let j = 0; j < outputWeights[i].length; j++) {
      outputWeights[i][j] += learningRate * error[i] * hidden[j];
    }
  }

  // Hidden weight güncelle
  for (let i = 0; i < hiddenWeights.length; i++) {
    for (let j = 0; j < hiddenWeights[i].length; j++) {
      hiddenWeights[i][j] += learningRate *
        error.reduce((sum, e, k) => sum + e*outputWeights[k][i], 0) *
        inputValues[j];
    }
  }

  saveWeights(); // eğitim sonrası kaydet
  drawNetwork(inputValues, hidden, output, "train");
  addTrainRow("Train", inputValues, hidden, output, targetValues, error);
}

function test() {
  const inputValues = getInputValues();
  const targetValues = getTargetValues();
  const {hidden, output} = forwardPass(inputValues);

  drawNetwork(inputValues, hidden, output, "test");
  addTestRow("Test", inputValues, hidden, output, targetValues);
}

function getInputValues() {
  return Array.from(document.querySelectorAll("#inputMatrix input"))
    .map(inp => parseFloat(inp.value) || 0);
}

function getTargetValues() {
  return Array.from(document.querySelectorAll("#targetMatrix input"))
    .map(inp => parseFloat(inp.value) || 0);
}

function drawNetwork(inputVals, hiddenVals, outputVals, mode) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const inputX = 100, hiddenX = 300, outputX = 500;
  const inputYStep = 100, hiddenYStep = 70, outputYStep = 150;

  let inputNodes = [];
  for (let i = 0; i < inputCount; i++) {
    let y = 100 + i*inputYStep;
    inputNodes.push({x: inputX, y});
  }

  let hiddenNodes = [];
  for (let i = 0; i < hiddenCount; i++) {
    let y = 70 + i*hiddenYStep;
    hiddenNodes.push({x: hiddenX, y});
  }

  let outputNodes = [];
  for (let i = 0; i < outputCount; i++) {
    let y = 100 + i*outputYStep;
    outputNodes.push({x: outputX, y});
  }

  // Önce bağlantıları çiz
  for (let i = 0; i < hiddenCount; i++) {
    for (let j = 0; j < inputCount; j++) {
      drawConnection(inputNodes[j], hiddenNodes[i], hiddenWeights[i][j], mode);
    }
  }
  for (let i = 0; i < outputCount; i++) {
    for (let j = 0; j < hiddenCount; j++) {
      drawConnection(hiddenNodes[j], outputNodes[i], outputWeights[i][j], mode);
    }
  }

  // Sonra daireleri çiz (çizgilerin üstüne gelir)
  inputNodes.forEach((node, i) => drawNode(node.x, node.y, inputVals[i]));
  hiddenNodes.forEach((node, i) => drawNode(node.x, node.y, hiddenVals[i].toFixed(2)));
  outputNodes.forEach((node, i) => drawNode(node.x, node.y, outputVals[i].toFixed(2)));
}

function drawNode(x, y, label) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI*2);
  ctx.fillStyle = "#fff";   // içi beyaz
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.font = "14px Segoe UI";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y); // değer tam ortada
}

function drawNode(x, y, label) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.fillText(label, x-10, y+5);
}

function drawConnection(nodeA, nodeB, weight, mode) {
  ctx.beginPath();
  ctx.moveTo(nodeA.x, nodeA.y);
  ctx.lineTo(nodeB.x, nodeB.y);

  if (mode === "test") {
    ctx.strokeStyle = "blue"; // testte mavi
    ctx.lineWidth = 2;
  } else {
    ctx.lineWidth = Math.max(1, Math.abs(weight)*3);
    ctx.strokeStyle = weight >= 0 ? "#4CAF50" : "#f44336";
  }
  ctx.stroke();
}

function addTrainRow(mode, input, hidden, output, target, error) {
  const tbody = document.querySelector("#trainResultsTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${mode}</td>
    <td>${input.join(", ")}</td>
    <td>${hidden.map(v => v.toFixed(2)).join(", ")}</td>
    <td>${output.map(v => v.toFixed(2)).join(", ")}</td>
    <td>${target.join(", ")}</td>
    <td>${error.map(v => v.toString()).join(", ")}</td>
  `;
  tbody.appendChild(row);
}

function addTestRow(mode, input, hidden, output, target) {
  const tbody = document.querySelector("#testResultsTable tbody");
  tbody.innerHTML = ""; // sadece son test sonucu göster
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${mode}</td>
    <td>${input.join(", ")}</td>
    <td>${hidden.map(v => v.toFixed(2)).join(", ")}</td>
    <td>${output.map(v => v.toFixed(2)).join(", ")}</td>
    <td>${target.join(", ")}</td>
  `;
  tbody.appendChild(row);
}

// İlk yüklemede ağırlıkları localStorage'dan al
loadWeights();

// İlk çizim
drawNetwork([1,0], [0,0,0,0], [0,0], "train");