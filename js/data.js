/* ═══════════════════════════════════════════════════════════════════════════
   ML VISUALIZATION PLAYGROUND — DATA & HELPERS
   All datasets, synthetic data generator, and statistical helper functions
   ═══════════════════════════════════════════════════════════════════════════ */

window.MLViz = window.MLViz || {};

/* ─────────────────────── STATISTICAL HELPERS ─────────────────────── */
MLViz.helpers = {
  mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  },

  median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  },

  std(arr) {
    const m = MLViz.helpers.mean(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
  },

  min(arr) { return Math.min(...arr); },
  max(arr) { return Math.max(...arr); },

  quartiles(arr) {
    const s = [...arr].sort((a, b) => a - b);
    const q = (p) => {
      const idx = (s.length - 1) * p;
      const lo = Math.floor(idx), hi = Math.ceil(idx);
      return s[lo] + (s[hi] - s[lo]) * (idx - lo);
    };
    return { q1: q(0.25), q2: q(0.5), q3: q(0.75) };
  },

  iqr(arr) {
    const { q1, q3 } = MLViz.helpers.quartiles(arr);
    return q3 - q1;
  },

  pearsonR(x, y) {
    const n = x.length;
    const mx = MLViz.helpers.mean(x), my = MLViz.helpers.mean(y);
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      num += dx * dy;
      dx2 += dx * dx;
      dy2 += dy * dy;
    }
    const denom = Math.sqrt(dx2 * dy2);
    return denom === 0 ? 0 : num / denom;
  },

  linearRegression(x, y) {
    const n = x.length;
    const mx = MLViz.helpers.mean(x), my = MLViz.helpers.mean(y);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - mx) * (y[i] - my);
      den += (x[i] - mx) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = my - slope * mx;
    return { slope, intercept, predict: (xv) => slope * xv + intercept };
  },

  polynomialRegression(x, y, degree) {
    // Simple polynomial fit using least squares (Vandermonde)
    const n = x.length;
    const d = degree + 1;
    // Build Vandermonde matrix
    const V = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < d; j++) row.push(Math.pow(x[i], j));
      V.push(row);
    }
    // Solve V^T V c = V^T y using Gaussian elimination
    const VtV = Array.from({ length: d }, (_, i) =>
      Array.from({ length: d }, (_, j) =>
        V.reduce((s, row) => s + row[i] * row[j], 0)
      )
    );
    const Vty = Array.from({ length: d }, (_, i) =>
      V.reduce((s, row, k) => s + row[i] * y[k], 0)
    );
    // Augmented matrix
    const aug = VtV.map((row, i) => [...row, Vty[i]]);
    // Gaussian elimination
    for (let col = 0; col < d; col++) {
      let maxRow = col;
      for (let row = col + 1; row < d; row++)
        if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
      if (Math.abs(aug[col][col]) < 1e-10) continue;
      for (let row = col + 1; row < d; row++) {
        const f = aug[row][col] / aug[col][col];
        for (let j = col; j <= d; j++) aug[row][j] -= f * aug[col][j];
      }
    }
    // Back substitution
    const coeffs = new Array(d).fill(0);
    for (let i = d - 1; i >= 0; i--) {
      coeffs[i] = aug[i][d];
      for (let j = i + 1; j < d; j++) coeffs[i] -= aug[i][j] * coeffs[j];
      coeffs[i] /= aug[i][i] || 1;
    }
    return {
      coeffs,
      predict: (xv) => coeffs.reduce((s, c, i) => s + c * Math.pow(xv, i), 0)
    };
  },

  // Generate array of evenly spaced values
  linspace(start, end, n) {
    const step = (end - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
  },

  // Random normal (Box-Muller)
  randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  },

  // Random normal with mean and std
  randnorm(mean, std) {
    return mean + std * MLViz.helpers.randn();
  },

  // Gaussian KDE
  kde(data, bandwidth, nPoints = 100) {
    if (!data.length) return { x: [], y: [] };
    const bw = bandwidth || 1.06 * MLViz.helpers.std(data) * Math.pow(data.length, -0.2) || 1;
    const min = MLViz.helpers.min(data) - 3 * bw;
    const max = MLViz.helpers.max(data) + 3 * bw;
    const xs = MLViz.helpers.linspace(min, max, nPoints);
    const ys = xs.map(x => {
      const sum = data.reduce((s, d) => {
        const z = (x - d) / bw;
        return s + Math.exp(-0.5 * z * z);
      }, 0);
      return sum / (data.length * bw * Math.sqrt(2 * Math.PI));
    });
    return { x: xs, y: ys };
  },

  // Compute correlation matrix
  corrMatrix(data, columns) {
    const n = columns.length;
    const matrix = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        const xi = data.map(r => r[columns[i]]).filter(v => typeof v === 'number');
        const xj = data.map(r => r[columns[j]]).filter(v => typeof v === 'number');
        row.push(MLViz.helpers.pearsonR(xi, xj));
      }
      matrix.push(row);
    }
    return matrix;
  },

  // Shuffle array
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Unique values
  unique(arr) { return [...new Set(arr)]; },

  // Pick random
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  // Clamp
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },

  // Round to decimals
  round(v, d = 2) { return Math.round(v * 10 ** d) / 10 ** d; },

  // R-squared
  rSquared(actual, predicted) {
    const ma = MLViz.helpers.mean(actual);
    const ssTot = actual.reduce((s, v) => s + (v - ma) ** 2, 0);
    const ssRes = actual.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
    return 1 - ssRes / (ssTot || 1);
  }
};

/* ─────────────────────── BUILT-IN DATASETS ─────────────────────── */
MLViz.datasets = {
  student: {
    name: 'Student Dataset',
    columns: ['Study_Hours', 'Marks', 'Attendance', 'Age', 'Branch'],
    numeric: ['Study_Hours', 'Marks', 'Attendance', 'Age'],
    categorical: ['Branch'],
    data: (() => {
      const branches = ['CS', 'EC', 'ME', 'CE', 'IT'];
      const rows = [];
      for (let i = 0; i < 120; i++) {
        const hours = MLViz.helpers.clamp(MLViz.helpers.randnorm(5, 2.5), 0.5, 12);
        const marks = MLViz.helpers.clamp(hours * 8 + MLViz.helpers.randnorm(10, 8), 5, 100);
        const attendance = MLViz.helpers.clamp(hours * 7 + MLViz.helpers.randnorm(40, 12), 20, 100);
        const age = Math.floor(MLViz.helpers.clamp(MLViz.helpers.randnorm(21, 1.5), 18, 26));
        rows.push({
          Study_Hours: MLViz.helpers.round(hours, 1),
          Marks: MLViz.helpers.round(marks, 1),
          Attendance: MLViz.helpers.round(attendance, 1),
          Age: age,
          Branch: MLViz.helpers.pick(branches)
        });
      }
      return rows;
    })()
  },

  employee: {
    name: 'Employee Dataset',
    columns: ['Age', 'Salary', 'Experience', 'Department', 'Education'],
    numeric: ['Age', 'Salary', 'Experience'],
    categorical: ['Department', 'Education'],
    data: (() => {
      const depts = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
      const edus = ['Bachelors', 'Masters', 'PhD'];
      const rows = [];
      for (let i = 0; i < 150; i++) {
        const exp = MLViz.helpers.clamp(Math.floor(MLViz.helpers.randnorm(8, 5)), 0, 30);
        const age = MLViz.helpers.clamp(22 + exp + Math.floor(MLViz.helpers.randnorm(0, 2)), 22, 60);
        const dept = MLViz.helpers.pick(depts);
        const edu = MLViz.helpers.pick(edus);
        const eduBonus = edu === 'PhD' ? 20000 : edu === 'Masters' ? 10000 : 0;
        const deptBonus = dept === 'Engineering' ? 15000 : dept === 'Finance' ? 10000 : 0;
        const salary = MLViz.helpers.clamp(
          30000 + exp * 3500 + eduBonus + deptBonus + MLViz.helpers.randnorm(0, 8000),
          25000, 180000
        );
        rows.push({
          Age: age,
          Salary: Math.round(salary),
          Experience: exp,
          Department: dept,
          Education: edu
        });
      }
      return rows;
    })()
  },

  sales: {
    name: 'Sales Dataset',
    columns: ['Product', 'Sales', 'Profit', 'Region', 'Month'],
    numeric: ['Sales', 'Profit'],
    categorical: ['Product', 'Region', 'Month'],
    data: (() => {
      const products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard'];
      const regions = ['North', 'South', 'East', 'West'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const rows = [];
      for (let i = 0; i < 200; i++) {
        const prod = MLViz.helpers.pick(products);
        const baseSales = prod === 'Laptop' ? 1200 : prod === 'Phone' ? 800 : prod === 'Tablet' ? 500 : prod === 'Monitor' ? 400 : 80;
        const sales = MLViz.helpers.clamp(baseSales + MLViz.helpers.randnorm(0, baseSales * 0.3), 20, 3000);
        const margin = prod === 'Keyboard' ? 0.4 : 0.15 + Math.random() * 0.2;
        rows.push({
          Product: prod,
          Sales: MLViz.helpers.round(sales, 0),
          Profit: MLViz.helpers.round(sales * margin, 0),
          Region: MLViz.helpers.pick(regions),
          Month: MLViz.helpers.pick(months)
        });
      }
      return rows;
    })()
  },

  titanic: {
    name: 'Titanic Dataset',
    columns: ['Age', 'Fare', 'Sex', 'Pclass', 'Survived'],
    numeric: ['Age', 'Fare'],
    categorical: ['Sex', 'Pclass', 'Survived'],
    data: (() => {
      const rows = [];
      for (let i = 0; i < 180; i++) {
        const sex = Math.random() > 0.45 ? 'Male' : 'Female';
        const pclass = MLViz.helpers.pick([1, 2, 3, 3, 3]);
        const age = MLViz.helpers.clamp(Math.floor(MLViz.helpers.randnorm(pclass === 1 ? 38 : 28, 12)), 1, 75);
        const fare = MLViz.helpers.clamp(
          pclass === 1 ? MLViz.helpers.randnorm(85, 60) : pclass === 2 ? MLViz.helpers.randnorm(20, 10) : MLViz.helpers.randnorm(10, 5),
          3, 300
        );
        // Survival: females & upper class more likely
        const survProb = (sex === 'Female' ? 0.5 : 0.15) + (pclass === 1 ? 0.25 : pclass === 2 ? 0.1 : 0);
        const survived = Math.random() < survProb ? 'Yes' : 'No';
        rows.push({
          Age: age,
          Fare: MLViz.helpers.round(fare, 1),
          Sex: sex,
          Pclass: pclass,
          Survived: survived
        });
      }
      return rows;
    })()
  },

  car: {
    name: 'Car Dataset',
    columns: ['MPG', 'Horsepower', 'Weight', 'Cylinders', 'Acceleration'],
    numeric: ['MPG', 'Horsepower', 'Weight', 'Acceleration'],
    categorical: ['Cylinders'],
    data: (() => {
      const rows = [];
      const cyls = [4, 4, 4, 4, 6, 6, 8, 8];
      for (let i = 0; i < 150; i++) {
        const cyl = MLViz.helpers.pick(cyls);
        const hp = MLViz.helpers.clamp(
          cyl === 4 ? MLViz.helpers.randnorm(85, 15) : cyl === 6 ? MLViz.helpers.randnorm(115, 15) : MLViz.helpers.randnorm(165, 25),
          50, 250
        );
        const weight = MLViz.helpers.clamp(
          cyl === 4 ? MLViz.helpers.randnorm(2300, 300) : cyl === 6 ? MLViz.helpers.randnorm(3100, 300) : MLViz.helpers.randnorm(3800, 400),
          1600, 5200
        );
        const mpg = MLViz.helpers.clamp(50 - hp * 0.12 - weight * 0.003 + MLViz.helpers.randnorm(0, 3), 8, 50);
        const accel = MLViz.helpers.clamp(8 + (250 - hp) * 0.04 + MLViz.helpers.randnorm(0, 1.2), 8, 25);
        rows.push({
          MPG: MLViz.helpers.round(mpg, 1),
          Horsepower: Math.round(hp),
          Weight: Math.round(weight),
          Cylinders: cyl,
          Acceleration: MLViz.helpers.round(accel, 1)
        });
      }
      return rows;
    })()
  },

  synthetic: {
    name: 'Synthetic ML Data',
    columns: ['X1', 'X2', 'X3', 'X4', 'Target'],
    numeric: ['X1', 'X2', 'X3', 'X4'],
    categorical: ['Target'],
    data: (() => {
      const rows = [];
      // Class 0
      for (let i = 0; i < 80; i++) {
        rows.push({
          X1: MLViz.helpers.round(MLViz.helpers.randnorm(3, 1.2), 2),
          X2: MLViz.helpers.round(MLViz.helpers.randnorm(3, 1.2), 2),
          X3: MLViz.helpers.round(MLViz.helpers.randnorm(5, 2), 2),
          X4: MLViz.helpers.round(MLViz.helpers.randnorm(2, 1), 2),
          Target: 'Class_0'
        });
      }
      // Class 1
      for (let i = 0; i < 60; i++) {
        rows.push({
          X1: MLViz.helpers.round(MLViz.helpers.randnorm(7, 1.2), 2),
          X2: MLViz.helpers.round(MLViz.helpers.randnorm(7, 1.2), 2),
          X3: MLViz.helpers.round(MLViz.helpers.randnorm(8, 2), 2),
          X4: MLViz.helpers.round(MLViz.helpers.randnorm(6, 1.5), 2),
          Target: 'Class_1'
        });
      }
      return rows;
    })()
  }
};

/* ─────────────────────── SYNTHETIC DATA GENERATOR ─────────────────────── */
MLViz.synthetic = {
  linear(n = 100, noise = 0.3, slope = 2, intercept = 5) {
    const data = [];
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 10;
      const y = slope * x + intercept + MLViz.helpers.randnorm(0, noise * 5);
      data.push({ x: MLViz.helpers.round(x, 2), y: MLViz.helpers.round(y, 2) });
    }
    return data;
  },

  nonlinear(n = 100, noise = 0.3) {
    const data = [];
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 10;
      const y = 0.5 * x * x - 3 * x + 10 + MLViz.helpers.randnorm(0, noise * 8);
      data.push({ x: MLViz.helpers.round(x, 2), y: MLViz.helpers.round(y, 2) });
    }
    return data;
  },

  clusters(n = 150, nClusters = 3) {
    const centers = [
      { cx: 2, cy: 2 }, { cx: 8, cy: 8 }, { cx: 2, cy: 8 },
      { cx: 8, cy: 2 }, { cx: 5, cy: 5 }
    ].slice(0, nClusters);
    const data = [];
    const perCluster = Math.floor(n / nClusters);
    centers.forEach((c, ci) => {
      for (let i = 0; i < perCluster; i++) {
        data.push({
          x: MLViz.helpers.round(MLViz.helpers.randnorm(c.cx, 1), 2),
          y: MLViz.helpers.round(MLViz.helpers.randnorm(c.cy, 1), 2),
          cluster: `Cluster_${ci}`
        });
      }
    });
    return data;
  },

  withOutliers(n = 100, nOutliers = 5) {
    const data = MLViz.synthetic.linear(n, 0.2);
    for (let i = 0; i < nOutliers; i++) {
      data.push({
        x: MLViz.helpers.round(Math.random() * 10, 2),
        y: MLViz.helpers.round(MLViz.helpers.randnorm(50, 10), 2),
        outlier: true
      });
    }
    return data;
  }
};

/* ─────────────────────── PALETTE DEFINITIONS ─────────────────────── */
MLViz.palettes = {
  deep:       ['#4C72B0', '#DD8452', '#55A868', '#C44E52', '#8172B3', '#937860', '#DA8BC3', '#8C8C8C', '#CCB974', '#64B5CD'],
  muted:      ['#4878D0', '#EE854A', '#6ACC64', '#D65F5F', '#956CB4', '#8C613C', '#DC7EC0', '#797979', '#D5BB67', '#82C6E2'],
  pastel:     ['#A1C9F4', '#FFB482', '#8DE5A1', '#FF9F9B', '#D0BBFF', '#DEBB9B', '#FAB0E4', '#CFCFCF', '#FFFEA3', '#B9F2F0'],
  bright:     ['#023EFF', '#FF7C00', '#1AC938', '#E8000B', '#8B2BE2', '#9F4800', '#F14CC1', '#A3A3A3', '#FFC400', '#00D7FF'],
  dark:       ['#001C7F', '#B1400D', '#12711C', '#8C0800', '#591E71', '#592F0D', '#A23582', '#3C3C3C', '#B8850A', '#006374'],
  colorblind: ['#0173B2', '#DE8F05', '#029E73', '#D55E00', '#CC78BC', '#CA9161', '#FBAFE4', '#949494', '#ECE133', '#56B4E9'],
  viridis:    ['#440154', '#482878', '#3E4989', '#31688E', '#26828E', '#1F9E89', '#35B779', '#6DCD59', '#B4DE2C', '#FDE725'],
  magma:      ['#000004', '#180F3D', '#440F76', '#721F81', '#9E2F7F', '#CD4071', '#F1605D', '#FD9668', '#FECA8D', '#FCFDBF'],
  plasma:     ['#0D0887', '#46039F', '#7201A8', '#9C179E', '#BD3786', '#D8576B', '#ED7953', '#FB9F3A', '#FDCA26', '#F0F921'],
  inferno:    ['#000004', '#1B0C41', '#4A0C6B', '#781C6D', '#A52C60', '#CF4446', '#ED6925', '#FB9B06', '#F7D13D', '#FCFFA4'],
  coolwarm:   ['#3B4CC0', '#5977E3', '#7B9FF9', '#9DBFFF', '#C0D4F5', '#F2CBB7', '#F7AC8E', '#EE8468', '#D65244', '#B40426']
};

/* ─────────────────────── SEABORN THEME CONFIGS ─────────────────────── */
MLViz.themes = {
  default:   { grid: false, bgColor: 'transparent', gridColor: 'rgba(128,128,128,0.15)' },
  whitegrid: { grid: true,  bgColor: '#EAEAF2',     gridColor: 'white' },
  darkgrid:  { grid: true,  bgColor: '#2C2C3A',     gridColor: 'rgba(255,255,255,0.1)' },
  ticks:     { grid: false, bgColor: 'transparent',  gridColor: 'rgba(128,128,128,0.15)' },
  dark:      { grid: false, bgColor: '#2C2C3A',      gridColor: 'rgba(255,255,255,0.08)' },
  white:     { grid: false, bgColor: '#FFFFFF',       gridColor: 'rgba(0,0,0,0.08)' },
  minimal:   { grid: false, bgColor: 'transparent',   gridColor: 'rgba(128,128,128,0.08)' }
};
