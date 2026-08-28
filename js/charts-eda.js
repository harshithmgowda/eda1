/* ═══════════════════════════════════════════════════════════════════════════
   ML VISUALIZATION PLAYGROUND — EDA & DIAGNOSTIC CHARTS
   Missing Values, Distribution Compare, Standardization, Outlier Lab,
   Subplots, Multi-Axes, Actual vs Predicted, Residual, Residual Distribution
   ═══════════════════════════════════════════════════════════════════════════ */

window.MLViz = window.MLViz || {};
MLViz.chartRegistry = MLViz.chartRegistry || {};
const HE = () => MLViz.helpers;

/* ═══════════════════════ MISSING VALUES ═══════════════════════ */
MLViz.chartRegistry.missing_values = {
  name: 'Missing Values', category: 'eda',
  libraries: { seaborn: 'sns.heatmap()', matplotlib: 'plt.imshow()' },
  description: 'Visualize missing data patterns in your dataset.',
  getControls() {
    return {
      data: [{ type: 'range', id: 'missingPct', label: 'Missing %', min: 0, max: 40, step: 1, default: 15 }],
      appearance: [{ type: 'select', id: 'colorscale', label: 'Colors', options: ['YlOrRd', 'Blues', 'Viridis', 'RdYlGn'] }],
      analysis: [], display: []
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const ds = MLViz.datasets[window.app ? window.app.state.dataset : 'student'];
    const cols = ds.columns;
    const nRows = 30;
    const pct = (state.missingPct || 15) / 100;
    const matrix = cols.map(c => Array.from({ length: nRows }, () => Math.random() < pct ? 0 : 1));
    const missingCounts = cols.map((c, i) => matrix[i].filter(v => v === 0).length);

    const traces = [{
      z: matrix, x: Array.from({ length: nRows }, (_, i) => `Row ${i + 1}`), y: cols,
      type: 'heatmap', colorscale: [[0, '#ef4444'], [1, '#22c55e']],
      showscale: false, hoverongaps: false,
      text: matrix.map(row => row.map(v => v === 0 ? 'MISSING' : 'Present')),
      hovertemplate: '%{y}, %{x}: %{text}<extra></extra>'
    }];

    const annotations = cols.map((c, i) => ({
      x: nRows + 1, y: c, text: `${missingCounts[i]}/${nRows} missing`, showarrow: false,
      font: { size: 10, color: missingCounts[i] > nRows * 0.2 ? '#ef4444' : '#22c55e' },
      xref: 'x', yref: 'y'
    }));

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Missing Values Heatmap', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, showgrid: false, showticklabels: false },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, showgrid: false, automargin: true },
      annotations, margin: { r: 100 }
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(12, 6))\nsns.heatmap(\n    df.isnull(),\n    cbar=False,\n    yticklabels=False,\n    cmap=["#22c55e", "#ef4444"]\n)\nplt.title("Missing Values")\nplt.tight_layout()\nplt.show()\n\n# Also useful:\nprint(df.isnull().sum())`;
  },
  getExplanation() { return [
    { icon: '🟩', text: 'Green = data present' },
    { icon: '🟥', text: 'Red = data missing' },
    { icon: '💡', text: 'Patterns in missingness can reveal systematic data issues' }
  ]; }
};

/* ═══════════════════════ DISTRIBUTION COMPARE ═══════════════════════ */
MLViz.chartRegistry.dist_compare = {
  name: 'Distribution Compare', category: 'eda',
  libraries: { seaborn: 'sns.histplot()', matplotlib: 'plt.hist()' },
  description: 'Compare distributions before and after data transformation.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'Variable', options: ds.numeric },
        { type: 'select', id: 'transform', label: 'Transformation', options: ['raw', 'log', 'standardize', 'minmax', 'sqrt'] },
      ],
      appearance: [{ type: 'range', id: 'bins', label: 'Bins', min: 10, max: 50, step: 1, default: 20 }],
      analysis: [{ type: 'toggle', id: 'showKDE', label: 'Show KDE', default: true }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() {
    return [
      { id: 'transform_log', label: '📐 Log' },
      { id: 'transform_std', label: '📏 Standardize' },
      { id: 'transform_sqrt', label: '√ Square Root' },
    ];
  },
  render(container, data, state) {
    const raw = data.map(r => r[state.x]).filter(v => typeof v === 'number' && v > 0);
    let transformed;
    const t = state.transform || 'raw';
    if (t === 'log') transformed = raw.map(v => Math.log(v + 1));
    else if (t === 'standardize') {
      const m = HE().mean(raw), s = HE().std(raw);
      transformed = raw.map(v => (v - m) / (s || 1));
    } else if (t === 'minmax') {
      const mn = HE().min(raw), mx = HE().max(raw);
      transformed = raw.map(v => (v - mn) / (mx - mn || 1));
    } else if (t === 'sqrt') transformed = raw.map(v => Math.sqrt(Math.abs(v)));
    else transformed = raw;

    const traces = [
      { x: raw, type: 'histogram', name: 'Original', nbinsx: state.bins || 20, marker: { color: '#2cbca588' }, opacity: 0.6, xaxis: 'x', yaxis: 'y' },
      { x: transformed, type: 'histogram', name: `After ${t}`, nbinsx: state.bins || 20, marker: { color: '#10b98188' }, opacity: 0.6, xaxis: 'x2', yaxis: 'y2' }
    ];

    if (state.showKDE && raw.length > 2) {
      const rawKDE = HE().kde(raw);
      const transKDE = HE().kde(transformed);
      const bw1 = (HE().max(raw) - HE().min(raw)) / (state.bins || 20);
      const bw2 = (HE().max(transformed) - HE().min(transformed)) / (state.bins || 20);
      traces.push(
        { x: rawKDE.x, y: rawKDE.y.map(v => v * raw.length * bw1), mode: 'lines', name: 'KDE (original)', line: { color: '#2cbca5', width: 2 }, xaxis: 'x', yaxis: 'y' },
        { x: transKDE.x, y: transKDE.y.map(v => v * transformed.length * bw2), mode: 'lines', name: `KDE (${t})`, line: { color: '#10b981', width: 2 }, xaxis: 'x2', yaxis: 'y2' }
      );
    }

    const base = MLViz.ThemeManager.getPlotlyLayout();
    const layout = {
      ...base, grid: { rows: 1, columns: 2, pattern: 'independent', xgap: 0.08 },
      title: { text: `${state.x}: Original vs ${t}`, font: { size: 14 } },
      xaxis: { ...base.xaxis, title: 'Original', showgrid: state.grid, domain: [0, 0.47] },
      yaxis: { ...base.yaxis, title: 'Count', showgrid: state.grid },
      xaxis2: { ...base.xaxis, title: `After ${t}`, showgrid: state.grid, domain: [0.53, 1] },
      yaxis2: { ...base.yaxis, title: 'Count', showgrid: state.grid },
      showlegend: true, barmode: 'overlay'
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    const transforms = { log: 'np.log1p(df[col])', standardize: '(df[col] - df[col].mean()) / df[col].std()', minmax: '(df[col] - df[col].min()) / (df[col].max() - df[col].min())', sqrt: 'np.sqrt(df[col])' };
    return `import matplotlib.pyplot as plt\nimport numpy as np\n\ncol = "${state.x}"\n\nfig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))\n\nax1.hist(df[col], bins=${state.bins || 20}, alpha=0.7)\nax1.set_title("Original")\n\ntransformed = ${transforms[state.transform] || 'df[col]'}\nax2.hist(transformed, bins=${state.bins || 20}, alpha=0.7, color="green")\nax2.set_title("After ${state.transform || 'raw'}")\n\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '📊', text: 'Left = original distribution, Right = after transformation' },
    { icon: '📐', text: 'Log transform reduces right skew' },
    { icon: '📏', text: 'Standardization centers data at 0 with std = 1' }
  ]; }
};

/* ═══════════════════════ STANDARDIZATION ═══════════════════════ */
MLViz.chartRegistry.standardization = {
  name: 'Standardization Viz', category: 'eda',
  libraries: { matplotlib: 'plt.hist()', seaborn: 'sns.histplot()' },
  description: 'Visualize data before and after standardization (Z-score normalization).',
  getControls(ds) {
    return {
      data: [{ type: 'select', id: 'x', label: 'Variable', options: ds.numeric }],
      appearance: [{ type: 'range', id: 'bins', label: 'Bins', min: 10, max: 40, step: 1, default: 20 }],
      analysis: [], display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const raw = data.map(r => r[state.x]).filter(v => typeof v === 'number');
    const m = HE().mean(raw), s = HE().std(raw);
    const standardized = raw.map(v => HE().round((v - m) / (s || 1), 2));
    const traces = [
      { x: raw, type: 'histogram', name: `Original (μ=${HE().round(m, 1)}, σ=${HE().round(s, 1)})`, nbinsx: state.bins, marker: { color: '#2cbca588' }, xaxis: 'x', yaxis: 'y' },
      { x: standardized, type: 'histogram', name: 'Standardized (μ=0, σ=1)', nbinsx: state.bins, marker: { color: '#22c55e88' }, xaxis: 'x2', yaxis: 'y2' }
    ];
    const base = MLViz.ThemeManager.getPlotlyLayout();
    const layout = {
      ...base, grid: { rows: 1, columns: 2, pattern: 'independent', xgap: 0.08 },
      title: { text: `Standardization of ${state.x}`, font: { size: 14 } },
      xaxis: { ...base.xaxis, title: 'Original', domain: [0, 0.47], showgrid: state.grid },
      yaxis: { ...base.yaxis, title: 'Count', showgrid: state.grid },
      xaxis2: { ...base.xaxis, title: 'Standardized (Z-score)', domain: [0.53, 1], showgrid: state.grid },
      yaxis2: { ...base.yaxis, title: 'Count', showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    return `from sklearn.preprocessing import StandardScaler\nimport matplotlib.pyplot as plt\n\nscaler = StandardScaler()\ndf["${state.x}_scaled"] = scaler.fit_transform(df[["${state.x}"]])\n\nfig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))\nax1.hist(df["${state.x}"], bins=20)\nax1.set_title("Before Standardization")\nax2.hist(df["${state.x}_scaled"], bins=20, color="green")\nax2.set_title("After Standardization")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [{ icon: '📏', text: 'Standardization transforms data to have mean=0 and std=1' }, { icon: '💡', text: 'Important for algorithms sensitive to scale (SVM, KNN, Neural Networks)' }]; }
};

/* ═══════════════════════ OUTLIER LAB ═══════════════════════ */
MLViz.chartRegistry.outlier_lab = {
  name: 'Outlier Detection Lab', category: 'eda',
  libraries: { seaborn: 'sns.boxplot()', matplotlib: 'plt.boxplot()' },
  description: 'Detect and visualize outliers — toggle removal to see the impact.',
  getControls(ds) {
    return {
      data: [{ type: 'select', id: 'x', label: 'Variable', options: ds.numeric }],
      appearance: [],
      analysis: [
        { type: 'toggle', id: 'removeOutliers', label: 'Remove Outliers' },
        { type: 'range', id: 'iqrMultiplier', label: 'IQR Multiplier', min: 1, max: 3, step: 0.1, default: 1.5 },
      ],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() {
    return [
      { id: 'toggle_outliers', label: '⚠️ Toggle Outliers' },
    ];
  },
  render(container, data, state) {
    const raw = data.map(r => r[state.x]).filter(v => typeof v === 'number');
    const q = HE().quartiles(raw);
    const iqr = q.q3 - q.q1;
    const mult = state.iqrMultiplier || 1.5;
    const lower = q.q1 - mult * iqr, upper = q.q3 + mult * iqr;
    const outliers = raw.filter(v => v < lower || v > upper);
    const clean = state.removeOutliers ? raw.filter(v => v >= lower && v <= upper) : raw;

    const traces = [
      { y: clean, type: 'box', name: state.removeOutliers ? 'Cleaned' : 'Original', boxpoints: 'outliers',
        marker: { color: '#2cbca5', outliercolor: '#ef4444' }, fillcolor: '#2cbca588', line: { color: '#2cbca5' } },
      { x: clean, type: 'histogram', name: 'Distribution', nbinsx: 20,
        marker: { color: '#2cbca566' }, xaxis: 'x2', yaxis: 'y2' }
    ];

    const base = MLViz.ThemeManager.getPlotlyLayout();
    const layout = {
      ...base, grid: { rows: 1, columns: 2, pattern: 'independent', xgap: 0.08 },
      title: { text: `Outlier Lab: ${state.x} (${outliers.length} outliers detected)`, font: { size: 14 } },
      xaxis: { ...base.xaxis, domain: [0, 0.35], showgrid: false },
      yaxis: { ...base.yaxis, title: state.x, showgrid: state.grid },
      xaxis2: { ...base.xaxis, title: state.x, domain: [0.42, 1], showgrid: state.grid },
      yaxis2: { ...base.yaxis, title: 'Count', showgrid: state.grid },
      showlegend: true,
      annotations: [
        { x: 0.5, y: 1.05, xref: 'paper', yref: 'paper', showarrow: false,
          text: state.removeOutliers ? `✅ ${outliers.length} outliers removed. N: ${raw.length} → ${clean.length}` : `⚠️ ${outliers.length} outliers detected (IQR × ${mult})`,
          font: { size: 12, color: state.removeOutliers ? '#22c55e' : '#f59e0b' } }
      ]
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    return `import pandas as pd\nimport matplotlib.pyplot as plt\n\ncol = "${state.x}"\nQ1 = df[col].quantile(0.25)\nQ3 = df[col].quantile(0.75)\nIQR = Q3 - Q1\nlower = Q1 - ${state.iqrMultiplier || 1.5} * IQR\nupper = Q3 + ${state.iqrMultiplier || 1.5} * IQR\n\noutliers = df[(df[col] < lower) | (df[col] > upper)]\nprint(f"Outliers: {len(outliers)}")\n\n${state.removeOutliers ? 'df_clean = df[(df[col] >= lower) & (df[col] <= upper)]\n\n' : ''}fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))\nax1.boxplot(df${state.removeOutliers ? '_clean' : ''}[col])\nax1.set_title("Box Plot")\nax2.hist(df${state.removeOutliers ? '_clean' : ''}[col], bins=20)\nax2.set_title("Distribution")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '📦', text: 'Box plot shows the data spread and outlier positions' },
    { icon: '⚠️', text: 'Red dots beyond whiskers are outliers' },
    { icon: '🔄', text: 'Toggle "Remove Outliers" to see how the distribution changes' },
    { icon: '📏', text: 'IQR multiplier controls sensitivity: lower = more outliers detected' }
  ]; }
};

/* ═══════════════════════ SUBPLOTS ═══════════════════════ */
MLViz.chartRegistry.subplots = {
  name: 'Subplots', category: 'layout',
  libraries: { matplotlib: 'plt.subplot() / plt.subplots()', seaborn: 'N/A' },
  description: 'Learn how to create multi-panel figure layouts in Matplotlib.',
  getControls() {
    return {
      data: [
        { type: 'select', id: 'rows', label: 'Rows', options: [1, 2, 3] },
        { type: 'select', id: 'cols', label: 'Columns', options: [1, 2, 3] },
      ],
      appearance: [], analysis: [], display: []
    };
  },
  getOperations() {
    return [
      { id: 'grid_1x2', label: '1×2' }, { id: 'grid_2x2', label: '2×2' }, { id: 'grid_2x3', label: '2×3' },
    ];
  },
  render(container, data, state) {
    const nRows = parseInt(state.rows) || 2, nCols = parseInt(state.cols) || 2;
    const ds = MLViz.datasets[window.app ? window.app.state.dataset : 'student'];
    const numCols = ds.numeric;
    const traces = [];
    const plotTypes = ['scatter', 'histogram', 'box', 'bar', 'line', 'violin', 'kde', 'scatter', 'histogram'];

    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        const idx = r * nCols + c;
        const axisIdx = idx === 0 ? '' : (idx + 1);
        const col1 = numCols[idx % numCols.length];
        const col2 = numCols[(idx + 1) % numCols.length];
        const pType = plotTypes[idx % plotTypes.length];

        if (pType === 'histogram') {
          traces.push({ x: data.map(r2 => r2[col1]).filter(v => typeof v === 'number'), type: 'histogram', name: col1, xaxis: `x${axisIdx}`, yaxis: `y${axisIdx}`, marker: { color: MLViz.palettes.deep[idx % 10] + '88' }, showlegend: false, nbinsx: 15 });
        } else if (pType === 'box') {
          traces.push({ y: data.map(r2 => r2[col1]).filter(v => typeof v === 'number'), type: 'box', name: col1, xaxis: `x${axisIdx}`, yaxis: `y${axisIdx}`, marker: { color: MLViz.palettes.deep[idx % 10] }, showlegend: false });
        } else {
          traces.push({
            x: data.map(r2 => r2[col1]).filter(v => typeof v === 'number'),
            y: data.map(r2 => r2[col2]).filter(v => typeof v === 'number'),
            mode: 'markers', type: 'scatter', name: `${col1} vs ${col2}`,
            xaxis: `x${axisIdx}`, yaxis: `y${axisIdx}`,
            marker: { size: 5, color: MLViz.palettes.deep[idx % 10], opacity: 0.6 }, showlegend: false
          });
        }
      }
    }

    const base = MLViz.ThemeManager.getPlotlyLayout();
    const layout = { ...base, title: { text: `Subplots (${nRows}×${nCols})`, font: { size: 14 } }, grid: { rows: nRows, columns: nCols, pattern: 'independent', xgap: 0.08, ygap: 0.12 }, showlegend: false, height: 400 };

    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        const idx = r * nCols + c + 1;
        const xk = idx === 1 ? 'xaxis' : `xaxis${idx}`;
        const yk = idx === 1 ? 'yaxis' : `yaxis${idx}`;
        layout[xk] = { ...base.xaxis, title: '', tickfont: { size: 9 } };
        layout[yk] = { ...base.yaxis, title: '', tickfont: { size: 9 } };
      }
    }
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    return `import matplotlib.pyplot as plt\n\nfig, axes = plt.subplots(${state.rows || 2}, ${state.cols || 2}, figsize=(12, 8))\n\n# Access individual subplot:\n# axes[row, col].plot(...)\n# axes[0, 0] is top-left\n# axes[0, 1] is top-right\n\nfor ax in axes.flat:\n    ax.set_xlabel("X")\n    ax.set_ylabel("Y")\n\nplt.suptitle("Subplots (${state.rows || 2}×${state.cols || 2})")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '📐', text: 'Figure = the whole canvas, Axes = individual plotting area' },
    { icon: '💡', text: 'axes[row, col] selects a specific subplot' },
    { icon: '🔢', text: 'Grid dimensions control how many plots appear' }
  ]; }
};

/* ═══════════════════════ MULTI AXES ═══════════════════════ */
MLViz.chartRegistry.multi_axes = {
  name: 'Multiple Axes', category: 'layout',
  libraries: { matplotlib: 'ax.twinx()', seaborn: 'N/A' },
  description: 'Overlay multiple variables with different scales on shared axes.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'y1', label: 'Y1 (Left Axis)', options: ds.numeric },
        { type: 'select', id: 'y2', label: 'Y2 (Right Axis)', options: ds.numeric, default: ds.numeric[1] },
      ],
      appearance: [
        { type: 'color', id: 'color1', label: 'Y1 Color', default: '#2cbca5' },
        { type: 'color', id: 'color2', label: 'Y2 Color', default: '#ef4444' },
      ],
      analysis: [], display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const y1 = data.map(r => r[state.y1]).filter(v => typeof v === 'number').slice(0, 50);
    const y2 = data.map(r => r[state.y2]).filter(v => typeof v === 'number').slice(0, 50);
    const x = Array.from({ length: Math.min(y1.length, y2.length) }, (_, i) => i + 1);
    const traces = [
      { x, y: y1, name: state.y1, mode: 'lines+markers', line: { color: state.color1 || '#2cbca5', width: 2 }, marker: { size: 5 } },
      { x, y: y2, name: state.y2, mode: 'lines+markers', yaxis: 'y2', line: { color: state.color2 || '#ef4444', width: 2 }, marker: { size: 5 } }
    ];
    const base = MLViz.ThemeManager.getPlotlyLayout();
    const layout = {
      ...base,
      title: { text: `${state.y1} & ${state.y2} (Dual Axes)`, font: { size: 14 } },
      xaxis: { ...base.xaxis, title: 'Index', showgrid: state.grid },
      yaxis: { ...base.yaxis, title: state.y1, titlefont: { color: state.color1 }, tickfont: { color: state.color1 }, showgrid: state.grid },
      yaxis2: { ...base.yaxis, title: state.y2, titlefont: { color: state.color2 }, tickfont: { color: state.color2 }, overlaying: 'y', side: 'right', showgrid: false },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    return `import matplotlib.pyplot as plt\n\nfig, ax1 = plt.subplots(figsize=(10, 6))\nax2 = ax1.twinx()\n\nax1.plot(df["${state.y1}"], color="${state.color1 || '#2cbca5'}", label="${state.y1}")\nax2.plot(df["${state.y2}"], color="${state.color2 || '#ef4444'}", label="${state.y2}")\n\nax1.set_xlabel("Index")\nax1.set_ylabel("${state.y1}", color="${state.color1 || '#2cbca5'}")\nax2.set_ylabel("${state.y2}", color="${state.color2 || '#ef4444'}")\n\nplt.title("${state.y1} & ${state.y2} (Dual Axes)")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [{ icon: '📊', text: 'Two Y-axes let you plot variables with different scales together' }]; }
};

/* ═══════════════════════ ACTUAL VS PREDICTED ═══════════════════════ */
MLViz.chartRegistry.actual_vs_pred = {
  name: 'Actual vs Predicted', category: 'diagnostics',
  libraries: { matplotlib: 'plt.scatter()', seaborn: 'sns.scatterplot()' },
  description: 'Regression diagnostic: compare model predictions to actual values.',
  getControls() {
    return {
      data: [{ type: 'range', id: 'noise', label: 'Prediction Noise', min: 0.05, max: 0.5, step: 0.05, default: 0.2 }],
      appearance: [{ type: 'color', id: 'color', label: 'Point Color', default: '#2cbca5' }],
      analysis: [{ type: 'toggle', id: 'showDiagonal', label: 'Perfect Prediction Line', default: true }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const actual = Array.from({ length: 100 }, () => HE().randnorm(50, 20));
    const predicted = actual.map(v => v + HE().randnorm(0, state.noise * 30));
    const traces = [{
      x: actual, y: predicted, mode: 'markers', name: 'Predictions',
      marker: { size: 7, color: state.color || '#2cbca5', opacity: 0.6 }
    }];
    if (state.showDiagonal) {
      const mn = Math.min(...actual, ...predicted), mx = Math.max(...actual, ...predicted);
      traces.push({ x: [mn, mx], y: [mn, mx], mode: 'lines', name: 'Perfect Prediction', line: { color: '#ef4444', width: 2, dash: 'dash' } });
    }
    const r2 = HE().rSquared(actual, predicted);
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Actual vs Predicted (R² = ${HE().round(r2, 3)})`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Actual', showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Predicted', showgrid: state.grid, scaleanchor: 'x', scaleratio: 1 },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `import matplotlib.pyplot as plt\n\nplt.figure(figsize=(8, 8))\nplt.scatter(y_test, y_pred, alpha=0.6)\n\n# Perfect prediction line\nimport numpy as np\nline = np.linspace(y_test.min(), y_test.max())\nplt.plot(line, line, "r--", label="Perfect")\n\nplt.xlabel("Actual")\nplt.ylabel("Predicted")\nplt.title("Actual vs Predicted")\nplt.legend()\nplt.axis("equal")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '🔴', text: 'Dashed line = perfect predictions (actual == predicted)' },
    { icon: '🔵', text: 'Points close to the line = good predictions' },
    { icon: '💡', text: 'Points far from the line = large errors' }
  ]; }
};

/* ═══════════════════════ RESIDUAL PLOT ═══════════════════════ */
MLViz.chartRegistry.residual = {
  name: 'Residual Plot', category: 'diagnostics',
  libraries: { matplotlib: 'plt.scatter()', seaborn: 'sns.residplot()' },
  description: 'Check for patterns in prediction errors — residuals should be random.',
  getControls() {
    return {
      data: [
        { type: 'select', id: 'pattern', label: 'Pattern', options: ['random', 'nonlinear', 'heteroscedastic', 'with_outliers'] }
      ],
      appearance: [{ type: 'color', id: 'color', label: 'Color', default: '#2cbca5' }],
      analysis: [{ type: 'toggle', id: 'showZero', label: 'Show Zero Line', default: true }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() {
    return [
      { id: 'pattern_random', label: '✅ Random' }, { id: 'pattern_nonlinear', label: '〰️ Nonlinear' },
      { id: 'pattern_hetero', label: '📐 Heteroscedastic' },
    ];
  },
  render(container, data, state) {
    const n = 100;
    const predicted = HE().linspace(10, 90, n);
    let residuals;
    if (state.pattern === 'nonlinear') residuals = predicted.map(p => Math.sin(p * 0.1) * 10 + HE().randnorm(0, 3));
    else if (state.pattern === 'heteroscedastic') residuals = predicted.map(p => HE().randnorm(0, p * 0.15));
    else if (state.pattern === 'with_outliers') {
      residuals = predicted.map(() => HE().randnorm(0, 5));
      for (let i = 0; i < 5; i++) residuals[Math.floor(Math.random() * n)] = HE().randnorm(0, 30);
    } else residuals = predicted.map(() => HE().randnorm(0, 5));

    const traces = [{
      x: predicted, y: residuals, mode: 'markers', name: 'Residuals',
      marker: { size: 7, color: state.color || '#2cbca5', opacity: 0.6 }
    }];
    if (state.showZero) {
      traces.push({ x: [10, 90], y: [0, 0], mode: 'lines', name: 'Zero', line: { color: '#ef4444', width: 2, dash: 'dash' } });
    }
    const patternLabel = { random: '✅ Random (Good!)', nonlinear: '⚠️ Nonlinear Pattern', heteroscedastic: '⚠️ Heteroscedastic', with_outliers: '⚠️ Outliers Present' };
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Residual Plot — ${patternLabel[state.pattern || 'random']}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Predicted', showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Residual', showgrid: state.grid },
      showlegend: false
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `import matplotlib.pyplot as plt\n\nresiduals = y_test - y_pred\n\nplt.figure(figsize=(10, 6))\nplt.scatter(y_pred, residuals, alpha=0.6)\nplt.axhline(y=0, color="red", linestyle="--")\nplt.xlabel("Predicted")\nplt.ylabel("Residual")\nplt.title("Residual Plot")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '✅', text: 'Random scatter around zero = good model' },
    { icon: '〰️', text: 'Curved pattern = model missing a nonlinear relationship' },
    { icon: '📐', text: 'Fan shape = heteroscedasticity (variance changes with predictions)' }
  ]; }
};

/* ═══════════════════════ RESIDUAL DISTRIBUTION ═══════════════════════ */
MLViz.chartRegistry.residual_dist = {
  name: 'Residual Distribution', category: 'diagnostics',
  libraries: { seaborn: 'sns.histplot()', matplotlib: 'plt.hist()' },
  description: 'Residuals should be normally distributed around zero.',
  getControls() {
    return {
      data: [{ type: 'range', id: 'skew', label: 'Skewness', min: -2, max: 2, step: 0.1, default: 0 }],
      appearance: [{ type: 'range', id: 'bins', label: 'Bins', min: 10, max: 40, step: 1, default: 20 }],
      analysis: [{ type: 'toggle', id: 'showKDE', label: 'Show KDE', default: true }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const n = 200;
    const skew = state.skew || 0;
    const residuals = Array.from({ length: n }, () => {
      let v = HE().randnorm(0, 5);
      if (skew > 0) v = Math.abs(v) * Math.sign(HE().randnorm(skew, 1));
      if (skew < 0) v = -Math.abs(v) * Math.sign(HE().randnorm(-skew, 1));
      return v;
    });
    const traces = [{
      x: residuals, type: 'histogram', name: 'Residuals', nbinsx: state.bins || 20,
      marker: { color: '#2cbca588' }
    }];
    if (state.showKDE) {
      const kd = HE().kde(residuals);
      const bw = (HE().max(residuals) - HE().min(residuals)) / (state.bins || 20);
      traces.push({ x: kd.x, y: kd.y.map(v => v * n * bw), mode: 'lines', name: 'KDE', line: { color: '#f59e0b', width: 2.5 } });
    }
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Residual Distribution', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Residual', showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Count', showgrid: state.grid },
      showlegend: true,
      shapes: [{ type: 'line', x0: 0, x1: 0, y0: 0, y1: 1, yref: 'paper', line: { color: '#ef4444', width: 2, dash: 'dash' } }]
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nresiduals = y_test - y_pred\n\nplt.figure(figsize=(10, 6))\nsns.histplot(residuals, kde=True, bins=20)\nplt.axvline(x=0, color="red", linestyle="--")\nplt.xlabel("Residual")\nplt.title("Residual Distribution")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '🔔', text: 'Should look like a bell curve centered at zero' },
    { icon: '🔴', text: 'Dashed red line at zero — residuals should cluster here' },
    { icon: '⚠️', text: 'Skewed distribution suggests the model has systematic bias' }
  ]; }
};
