const imageInput = document.getElementById('imageInput');
const countButton = document.getElementById('countButton');
const resetButton = document.getElementById('resetButton');
const displayCanvas = document.getElementById('displayCanvas');
const workCanvas = document.getElementById('workCanvas');
const readout = document.getElementById('readout');
const legend = document.getElementById('legend');
const stats = document.getElementById('stats');

const scaleInput = document.getElementById('scaleInput');
const scaleValue = document.getElementById('scaleValue');
const toleranceInput = document.getElementById('toleranceInput');
const toleranceValue = document.getElementById('toleranceValue');
const minBlobInput = document.getElementById('minBlobInput');
const minBlobValue = document.getElementById('minBlobValue');
const bboxToggle = document.getElementById('bboxToggle');
const bgPickButton = document.getElementById('bgPickButton');
const bgHint = document.getElementById('bgHint');
const marblePickButton = document.getElementById('marblePickButton');
const marbleHint = document.getElementById('marbleHint');
const pickedMarblesDiv = document.getElementById('pickedMarbles');
const usePickedMarbles = document.getElementById('usePickedMarbles');
const bgColorInput = document.getElementById('bgColorInput');
const useManualBg = document.getElementById('useManualBg');
const exportCsv = document.getElementById('exportCsv');
const exportJson = document.getElementById('exportJson');
const confidence = document.getElementById('confidence');

let manualBgColor = null;
let shouldPickBg = false;
let pickingMarbles = false;
let pickedMarbleColors = [];
let lastResults = null;

scaleInput.oninput = () => scaleValue.textContent = scaleInput.value;
toleranceInput.oninput = () => toleranceValue.textContent = toleranceInput.value;
minBlobInput.oninput = () => minBlobValue.textContent = minBlobInput.value;

let currentImage = null;
let sourceImageData = null;

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);

    currentImage = img;
    renderToCanvases(img);
    countButton.disabled = false;
    resetButton.disabled = false;
    bgPickButton.disabled = false;
    marblePickButton.disabled = false;
    exportCsv.disabled = true;
    exportJson.disabled = true;
    readout.textContent = 'Image loaded. Ready to count.';
  };
  img.onerror = () => {
    readout.textContent = 'Failed to load image.';
  };
  img.src = url;
});

bgPickButton.addEventListener('click', () => {
  if (!currentImage) {
    readout.textContent = 'Upload an image first to pick background.';
    return;
  }
  shouldPickBg = true;
  pickingMarbles = false;
  bgHint.textContent = 'Now click on the image to set background color.';
  marbleHint.textContent = 'Marble pick mode off.';
  bgPickButton.disabled = true;
});

marblePickButton.addEventListener('click', () => {
  if (!currentImage) {
    readout.textContent = 'Upload an image first to pick marble color.';
    return;
  }
  pickingMarbles = true;
  shouldPickBg = false;
  marbleHint.textContent = 'Now click on marble pixels to add color to the palette (double-click clears).';
  marblePickButton.disabled = true;
});

displayCanvas.addEventListener('click', (ev) => {
  const rect = displayCanvas.getBoundingClientRect();
  const x = Math.round((ev.clientX - rect.left) * (displayCanvas.width / rect.width));
  const y = Math.round((ev.clientY - rect.top) * (displayCanvas.height / rect.height));
  const ctx = displayCanvas.getContext('2d');

  if (shouldPickBg) {
    const p = ctx.getImageData(x, y, 1, 1).data;
    manualBgColor = [p[0], p[1], p[2]];
    const hex = rgbToHex(p[0], p[1], p[2]);
    bgColorInput.value = hex;
    useManualBg.checked = true;
    shouldPickBg = false;
    bgHint.textContent = `Background set to ${hex}.`;
    bgPickButton.disabled = false;
    return;
  }

  if (pickingMarbles) {
    const p = ctx.getImageData(x, y, 1, 1).data;
    const color = [p[0], p[1], p[2]];
    const key = color.join(',');
    if (!pickedMarbleColors.some((c) => c.join(',') === key)) {
      pickedMarbleColors.push(color);
      const swatch = document.createElement('div');
      swatch.className = 'picked-color';
      swatch.style.background = `rgb(${color.join(',')})`;
      const label = document.createElement('span');
      label.textContent = `#${rgbToHex(color[0], color[1], color[2]).slice(1)}`;
      swatch.appendChild(label);
      pickedMarblesDiv.appendChild(swatch);
    }
    if (ev.detail === 2) {
      // double click resets picking mode and palette
      pickedMarbleColors = [];
      pickedMarblesDiv.innerHTML = '';
      marbleHint.textContent = 'Picked colors cleared.';
    }
    return;
  }
});

resetButton.addEventListener('click', () => {
  imageInput.value = '';
  countButton.disabled = true;
  resetButton.disabled = true;
  bgPickButton.disabled = true;
  marblePickButton.disabled = true;
  exportCsv.disabled = true;
  exportJson.disabled = true;
  readout.textContent = '';
  legend.innerHTML = '';
  stats.textContent = '';
  confidence.textContent = '';
  bgHint.textContent = 'Click the button then click the image to choose background color.';
  marbleHint.textContent = 'Click the button then click the image to pick marble colors.';
  pickedMarblesDiv.innerHTML = '';
  usePickedMarbles.checked = false;
  shouldPickBg = false;
  pickingMarbles = false;
  pickedMarbleColors = [];
  const ctx = displayCanvas.getContext('2d');
  ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
  currentImage = null;
  sourceImageData = null;
  manualBgColor = null;
  lastResults = null;
});

exportCsv.addEventListener('click', () => {
  if (!lastResults) return;
  const rows = ['color,count,minX,minY,maxX,maxY,area'];
  for (const group of lastResults.groups) {
    for (const b of group.blobs) {
      rows.push(`${group.color.join('|')},${group.count},${b.minX},${b.minY},${b.maxX},${b.maxY},${b.area}`);
    }
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'marble-count.csv';
  a.click();
});

exportJson.addEventListener('click', () => {
  if (!lastResults) return;
  const file = new Blob([JSON.stringify(lastResults, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = 'marble-count.json';
  a.click();
});

countButton.addEventListener('click', () => {
  if (!currentImage || !sourceImageData) {
    readout.textContent = 'Load an image first.';
    return;
  }
  const tolerance = Number(toleranceInput.value);
  const minBlobArea = Number(minBlobInput.value);
  runCounting(sourceImageData, tolerance, minBlobArea);
});

function renderToCanvases(img) {
  const maxSide = Number(scaleInput.value) || 1024;
  const resizeRatio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * resizeRatio));
  const height = Math.max(1, Math.round(img.height * resizeRatio));

  displayCanvas.width = width;
  displayCanvas.height = height;
  workCanvas.width = width;
  workCanvas.height = height;

  const workCtx = workCanvas.getContext('2d');
  workCtx.drawImage(img, 0, 0, width, height);
  sourceImageData = workCtx.getImageData(0, 0, width, height);

  const displayCtx = displayCanvas.getContext('2d');
  displayCtx.clearRect(0, 0, width, height);
  displayCtx.drawImage(img, 0, 0, width, height);
}

function runCounting(imageData, tolerance, minBlobArea) {
  const { data, width, height } = imageData;

  const colorCount = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const key = `${data[i]},${data[i+1]},${data[i+2]}`;
    colorCount.set(key, (colorCount.get(key) || 0) + 1);
  }

  if (!colorCount.size) {
    readout.textContent = 'No pixels to process';
    return;
  }

  let bgRGB;
  if (useManualBg.checked) {
    if (manualBgColor) {
      bgRGB = manualBgColor;
    } else {
      bgRGB = hexToRGB(bgColorInput.value);
    }
  } else {
    const bkColor = findMostFrequentColor(colorCount);
    bgRGB = bkColor.split(',').map(Number);
  }

  const mask = new Uint8Array(width * height);
  let nonBgCount = 0;
  const usePicked = usePickedMarbles.checked && pickedMarbleColors.length > 0;

  function matchesColor(r, g, b, ref) {
    return Math.abs(r-ref[0]) <= tolerance && Math.abs(g-ref[1]) <= tolerance && Math.abs(b-ref[2]) <= tolerance;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let isForeground = false;

      if (usePicked) {
        // marble selection mode: keep pixels close to any picked color
        isForeground = pickedMarbleColors.some((c) => matchesColor(r,g,b,c));
      } else {
        // generic mode: remove background by tolerance
        isForeground = !matchesColor(r,g,b,bgRGB);
      }

      if (isForeground) {
        mask[y*width + x] = 1;
        nonBgCount++;
      } else {
        mask[y*width + x] = 0;
      }
    }
  }

  if (!nonBgCount) {
    readout.textContent = 'No marble candidates found (all background). Adjust tolerance.';
    return;
  }

  const segments = connectedComponents(mask, width, height);
  const blobs = [];

  for (const comp of segments.values()) {
    if (comp.area < minBlobArea) continue;
    blobs.push(comp);
  }

  if (!blobs.length) {
    readout.textContent = 'No blobs found above min blob area. Reduce min blob size.';
    legend.innerHTML = '';
    stats.textContent = '';
    return;
  }

  for (const blob of blobs) {
    let r=0, g=0, b=0;
    for (const idx of blob.pixels) {
      const pi = idx * 4;
      r += data[pi];
      g += data[pi + 1];
      b += data[pi + 2];
    }
    const n = blob.area;
    blob.avgColor = [Math.round(r/n), Math.round(g/n), Math.round(b/n)];
  }

  const colorKeyed = new Map();
  for (const blob of blobs) {
    const key = quantizeColor(blob.avgColor, 32);
    if (!colorKeyed.has(key)) colorKeyed.set(key, { color: blob.avgColor, count: 0, blobs: [] });
    const entry = colorKeyed.get(key);
    entry.count += 1;
    entry.blobs.push(blob);
  }

  displayResults(colorKeyed, blobs.length, width, height, bgRGB);
}

function findMostFrequentColor(colorCount) {
  let best = null;
  let bestCount = -1;
  for (const [color, count] of colorCount.entries()) {
    if (count > bestCount) {
      bestCount = count;
      best = color;
    }
  }
  return best;
}

function quantizeColor([r, g, b], step) {
  const qr = Math.round(r / step) * step;
  const qg = Math.round(g / step) * step;
  const qb = Math.round(b / step) * step;
  return `${Math.max(0, Math.min(255, qr))},${Math.max(0, Math.min(255, qg))},${Math.max(0, Math.min(255, qb))}`;
}

function rgbToHex(r, g, b) {
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRGB(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function connectedComponents(mask, width, height) {
  const labels = new Int32Array(width * height);
  let nextLabel = 1;
  const union = [];

  function find(x) {
    while (union[x] !== x) x = union[x];
    return x;
  }

  function unionFind(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) union[rb] = ra;
  }

  for (let i = 0; i < width*height; i++) {
    if (!mask[i]) continue;
    let label = 0;
    const x = i % width;
    const y = Math.floor(i / width);

    const top = y > 0 ? labels[i - width] : 0;
    const left = x > 0 ? labels[i - 1] : 0;

    if (top === 0 && left === 0) {
      label = nextLabel;
      nextLabel += 1;
      union[label] = label;
    } else if (top !== 0 && left === 0) {
      label = top;
    } else if (left !== 0 && top === 0) {
      label = left;
    } else {
      label = top;
      if (left !== top) unionFind(top, left);
    }
    labels[i] = label;
  }

  const finalLabel = new Int32Array(nextLabel + 1);
  for (let i = 1; i < nextLabel; i++) finalLabel[i] = find(i);

  const components = new Map();
  for (let i = 0; i < width*height; i++) {
    const lab = labels[i];
    if (lab === 0) continue;
    const root = finalLabel[lab];
    if (!components.has(root)) {
      components.set(root, { area: 0, pixels: [], minX: width, minY: height, maxX: 0, maxY: 0 });
    }
    const comp = components.get(root);
    comp.area++;
    comp.pixels.push(i);
    const x = i % width;
    const y = Math.floor(i / width);
    if (x < comp.minX) comp.minX = x;
    if (x > comp.maxX) comp.maxX = x;
    if (y < comp.minY) comp.minY = y;
    if (y > comp.maxY) comp.maxY = y;
  }

  return components;
}

function displayResults(colorKeyed, totalMarbles, width, height, bgRGB) {
  legend.innerHTML = '';
  const pickedColorsSummary = document.getElementById('pickedColorsSummary');
  pickedColorsSummary.innerHTML = '';

  if (usePickedMarbles.checked && pickedMarbleColors.length) {
    const label = document.createElement('div');
    label.style.marginBottom = '6px';
    label.textContent = 'Picked marble colors:';
    pickedColorsSummary.appendChild(label);

    const palette = document.createElement('div');
    palette.style.display = 'flex';
    palette.style.gap = '6px';
    palette.style.flexWrap = 'wrap';

    for (const c of pickedMarbleColors) {
      const dot = document.createElement('span');
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.display = 'inline-block';
      dot.style.border = '1px solid black';
      dot.style.backgroundColor = `rgb(${c.join(',')})`;
      dot.style.borderRadius = '4px';
      palette.appendChild(dot);
    }

    pickedColorsSummary.appendChild(palette);
  }

  stats.textContent = `Detected ${totalMarbles} marbles in ${colorKeyed.size} color group(s).`;

  for (const [key, entry] of colorKeyed.entries()) {
    const item = document.createElement('div');
    item.className = 'item';
    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = `rgb(${entry.color.join(',')})`;
    item.appendChild(swatch);
    item.appendChild(document.createTextNode(`${entry.count} marbles`));
    legend.appendChild(item);
  }

  const ctx = displayCanvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(currentImage, 0, 0, width, height);

  if (bboxToggle.checked) {
    const colors = Array.from(colorKeyed.values()).flatMap((entry) => entry.blobs || []);
    for (const blob of colors) {
      const [r, g, b] = blob.avgColor;
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(blob.minX, blob.minY, blob.maxX - blob.minX + 1, blob.maxY - blob.minY + 1);
    }
  }

  readout.textContent = 'Complete.';

  lastResults = {
    totalMarbles,
    groups: Array.from(colorKeyed.entries()).map(([key, entry]) => ({ colorKey: key, color: entry.color, count: entry.count, blobs: entry.blobs })),
    background: bgRGB,
    width,
    height,
  };

  exportCsv.disabled = false;
  exportJson.disabled = false;

  const blobAreas = [].concat(...Array.from(colorKeyed.values(), e => e.blobs.map(b => b.area)));
  if (blobAreas.length) {
    const avgArea = blobAreas.reduce((s,v)=>s+v,0)/blobAreas.length;
    const areaStd = Math.sqrt(blobAreas.reduce((s,v)=>s+Math.pow(v-avgArea,2),0) / blobAreas.length);
    confidence.textContent = `Area consistency: avg=${avgArea.toFixed(1)}, std=${areaStd.toFixed(1)}. Use narrower tolerance if std is high.`;
  } else {
    confidence.textContent = '';
  }
}
