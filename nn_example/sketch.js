const neuronCount = 56;
const connectionBudget = 3;
const stimulationRadius = 36;

const modeConfigs = {
  perception: { spreadChance: 0.16, decayRate: 0.04, hue: [46, 162, 216] },
  cognition: { spreadChance: 0.24, decayRate: 0.03, hue: [90, 130, 232] },
  learning: { spreadChance: 0.3, decayRate: 0.02, hue: [218, 121, 56] }
};

const simulationState = {
  nodes: [],
  edges: [],
  modeName: "perception",
  paused: false,
  showOverlay: true,
  showHelp: true
};

function setup() {
  const host = document.getElementById("canvas-root");
  const canvas = createCanvas(getCanvasWidth(host), getCanvasHeight());
  canvas.parent("canvas-root");
  resetSimulation();
}

function draw() {
  drawBackgroundGradient();

  if (!simulationState.paused) {
    advanceSignalStep();
  }

  drawEdges();
  drawNodes();

  if (simulationState.showOverlay) {
    drawOverlayPanel();
  }
}

function windowResized() {
  const host = document.getElementById("canvas-root");
  resizeCanvas(getCanvasWidth(host), getCanvasHeight());
  redistributeNodes();
}

function mousePressed() {
  const targetIndex = findClosestNeuron(mouseX, mouseY, stimulationRadius);
  if (targetIndex >= 0) {
    stimulateNeuron(targetIndex, 1);
  }
}

function keyPressed() {
  const keyName = key.toLowerCase();

  if (keyName === "1") {
    simulationState.modeName = "perception";
  }
  if (keyName === "2") {
    simulationState.modeName = "cognition";
  }
  if (keyName === "3") {
    simulationState.modeName = "learning";
  }
  if (keyName === "o") {
    simulationState.showOverlay = !simulationState.showOverlay;
  }
  if (keyName === "h") {
    simulationState.showHelp = !simulationState.showHelp;
  }
  if (keyName === " ") {
    simulationState.paused = !simulationState.paused;
  }
  if (keyName === "r") {
    resetSimulation();
  }
}

function resetSimulation() {
  simulationState.nodes = createNodes(neuronCount);
  simulationState.edges = createConnections(simulationState.nodes, connectionBudget);
}

function createNodes(totalNodes) {
  const nodes = [];
  for (let index = 0; index < totalNodes; index += 1) {
    nodes.push({
      id: index,
      x: random(48, width - 48),
      y: random(68, height - 48),
      activity: 0,
      pulse: 0
    });
  }
  return nodes;
}

function createConnections(nodes, maxConnectionsPerNode) {
  const edges = [];
  const seenPairs = new Set();

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
    const localTargets = [];

    while (localTargets.length < maxConnectionsPerNode) {
      const targetIndex = floor(random(nodes.length));
      if (targetIndex === nodeIndex || localTargets.includes(targetIndex)) {
        continue;
      }

      localTargets.push(targetIndex);
      const pairKey = [Math.min(nodeIndex, targetIndex), Math.max(nodeIndex, targetIndex)].join("-");
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        edges.push({ from: nodeIndex, to: targetIndex, signal: 0 });
      }
    }
  }

  return edges;
}

function advanceSignalStep() {
  const mode = modeConfigs[simulationState.modeName];

  simulationState.edges.forEach((edge) => {
    const source = simulationState.nodes[edge.from];
    const target = simulationState.nodes[edge.to];

    if (source.activity > 0.4 && random() < mode.spreadChance) {
      target.pulse = max(target.pulse, source.activity * 0.85);
      edge.signal = 1;
    }

    edge.signal = max(0, edge.signal - 0.06);
  });

  simulationState.nodes.forEach((node) => {
    const nextActivity = max(node.activity, node.pulse);
    node.activity = max(0, nextActivity - mode.decayRate);
    node.pulse = 0;
  });
}

function stimulateNeuron(nodeIndex, intensity) {
  const chosenNode = simulationState.nodes[nodeIndex];
  if (chosenNode) {
    chosenNode.pulse = max(chosenNode.pulse, intensity);
  }
}

function findClosestNeuron(xPosition, yPosition, radiusLimit) {
  let bestIndex = -1;
  let bestDistance = radiusLimit;

  simulationState.nodes.forEach((node, index) => {
    const distanceToMouse = dist(xPosition, yPosition, node.x, node.y);
    if (distanceToMouse < bestDistance) {
      bestDistance = distanceToMouse;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function drawEdges() {
  const mode = modeConfigs[simulationState.modeName];

  simulationState.edges.forEach((edge) => {
    const fromNode = simulationState.nodes[edge.from];
    const toNode = simulationState.nodes[edge.to];
    const alpha = map(edge.signal, 0, 1, 28, 180);

    stroke(mode.hue[0], mode.hue[1], mode.hue[2], alpha);
    strokeWeight(edge.signal > 0 ? 2 : 1);
    line(fromNode.x, fromNode.y, toNode.x, toNode.y);
  });
}

function drawNodes() {
  const mode = modeConfigs[simulationState.modeName];

  simulationState.nodes.forEach((node) => {
    const baseSize = 8;
    const glowSize = baseSize + node.activity * 20;

    noStroke();
    fill(mode.hue[0], mode.hue[1], mode.hue[2], 70);
    circle(node.x, node.y, glowSize);

    fill(20, 32, 38, 210);
    circle(node.x, node.y, baseSize);
  });
}

function drawOverlayPanel() {
  const modeText = `Mode: ${simulationState.modeName.toUpperCase()} | ${simulationState.paused ? "Paused" : "Running"}`;
  const descriptionText = "Scaled abstraction: 56 nodes and sampled links, inspired by 10^11 neurons and 10^15 links.";
  const helpText = "Mouse: click near neuron to stimulate | Keys: 1/2/3 modes, Space pause, O overlay, H help, R reset";

  const panelX = 12;
  const panelY = 12;
  const panelWidth = min(410, width - 24);
  const contentX = panelX + 10;
  const contentWidth = panelWidth - 20;

  fill(12, 24, 28);
  textSize(13);
  const lineHeight = max(16, textAscent() + textDescent() + 3);

  const modeY = panelY + 22;
  const descriptionY = modeY + lineHeight + 6;
  const descriptionLineCount = getWrappedLineCount(descriptionText, contentWidth);
  const descriptionBottomY = descriptionY + (descriptionLineCount - 1) * lineHeight;

  const helpLineCount = simulationState.showHelp ? getWrappedLineCount(helpText, contentWidth) : 0;
  const helpY = descriptionBottomY + lineHeight + 6;
  const helpBottomY = helpY + (helpLineCount - 1) * lineHeight;

  const panelBottomY = simulationState.showHelp
    ? helpBottomY + 10
    : descriptionBottomY + 10;
  const panelHeight = panelBottomY - panelY;

  fill(255, 247, 232, 236);
  noStroke();
  rect(panelX, panelY, panelWidth, panelHeight, 8);

  fill(12, 24, 28);
  text(modeText, contentX, modeY);
  text(descriptionText, contentX, descriptionY, contentWidth);

  if (simulationState.showHelp) {
    text(helpText, contentX, helpY, contentWidth);
  }
}

function getWrappedLineCount(message, maxWidth) {
  if (!message || maxWidth <= 0) {
    return 1;
  }

  const words = message.split(" ");
  let lineCount = 1;
  let currentLine = "";

  words.forEach((word) => {
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    if (textWidth(candidateLine) <= maxWidth) {
      currentLine = candidateLine;
      return;
    }

    lineCount += 1;
    currentLine = word;
  });

  return lineCount;
}

function drawBackgroundGradient() {
  for (let y = 0; y < height; y += 1) {
    const blendValue = map(y, 0, height, 0, 1);
    const colorA = color(245, 238, 221);
    const colorB = color(205, 225, 226);
    const gradientColor = lerpColor(colorA, colorB, blendValue);
    stroke(gradientColor);
    line(0, y, width, y);
  }
}

function redistributeNodes() {
  simulationState.nodes.forEach((node) => {
    node.x = constrain(node.x, 48, width - 48);
    node.y = constrain(node.y, 68, height - 48);
  });
}

function getCanvasWidth(hostElement) {
  return max(320, hostElement?.clientWidth || 880);
}

function getCanvasHeight() {
  return window.innerWidth < 720 ? 360 : 500;
}
