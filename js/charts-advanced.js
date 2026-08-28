/* ═══════════════════════════════════════════════════════════════════════════
   ML VISUALIZATION PLAYGROUND — ADVANCED CHARTS
   Pairplot, Jointplot, Hexbin, Confusion Matrix, Feature Importance,
   ROC, PR Curve, Learning Curve, Loss Curve, Strip, Swarm, Point, Catplot, LMplot
   ═══════════════════════════════════════════════════════════════════════════ */

window.MLViz = window.MLViz || {};
MLViz.chartRegistry = MLViz.chartRegistry || {};
const HA = () => MLViz.helpers;
const PA = () => MLViz.palettes;

/* ═══════════════════════ STRIP PLOT ═══════════════════════ */
MLViz.chartRegistry.strip = {
  name: 'Strip Plot', category: 'categorical',
  libraries: { seaborn: 'sns.stripplot()', matplotlib: 'plt.scatter() + jitter' },
  description: 'Show individual observations by category with jitter.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'Category', options: [...ds.categorical] },
        { type: 'select', id: 'y', label: 'Value', options: ds.numeric },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [
        { type: 'range', id: 'jitter', label: 'Jitter', min: 0, max: 0.5, step: 0.05, default: 0.2 },
        { type: 'range', id: 'pointSize', label: 'Point Size', min: 3, max: 12, step: 1, default: 6 },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.2, max: 1, step: 0.1, default: 0.6 },
      ],
      analysis: [], display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state, palette) {
    const groups = {};
    data.forEach(r => { const g = String(r[state.x]); if (!groups[g]) groups[g] = []; groups[g].push(r); });
    const cats = Object.keys(groups);
    const traces = [];
    cats.forEach((cat, ci) => {
      const vals = groups[cat].map(r => r[state.y]).filter(v => typeof v === 'number');
      const jx = vals.map(() => ci + (Math.random() - 0.5) * (state.jitter || 0.2) * 2);
      traces.push({
        x: jx, y: vals, mode: 'markers', name: cat, type: 'scatter',
        marker: { size: state.pointSize || 6, color: palette[ci % palette.length], opacity: state.alpha || 0.6 }
      });
    });
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `${state.y} by ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, tickvals: cats.map((_, i) => i), ticktext: cats, title: state.x, showgrid: false },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'seaborn') return `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.stripplot(data=df, x="${state.x}", y="${state.y}", jitter=${state.jitter || 0.2}, alpha=${state.alpha || 0.6})\nplt.title("${state.y} by ${state.x}")\nplt.tight_layout()\nplt.show()`;
    return `import matplotlib.pyplot as plt\nimport numpy as np\n\nfor i, cat in enumerate(df["${state.x}"].unique()):\n    subset = df[df["${state.x}"] == cat]["${state.y}"]\n    jitter = np.random.uniform(-${state.jitter || 0.2}, ${state.jitter || 0.2}, len(subset))\n    plt.scatter(i + jitter, subset, alpha=${state.alpha || 0.6}, label=cat)\nplt.legend()\nplt.title("${state.y} by ${state.x}")\nplt.show()`;
  },
  getExplanation() { return [{ icon: '📍', text: 'Each point is one observation, jittered to avoid overlap' }, { icon: '📊', text: 'See actual data distribution within each category' }]; }
};

/* ═══════════════════════ SWARM PLOT ═══════════════════════ */
MLViz.chartRegistry.swarm = {
  name: 'Swarm Plot', category: 'categorical',
  libraries: { seaborn: 'sns.swarmplot()', matplotlib: 'N/A (use seaborn)' },
  description: 'Non-overlapping points showing distribution by category.',
  getControls(ds) { return MLViz.chartRegistry.strip.getControls(ds); },
  getOperations() { return []; },
  render(container, data, state, palette) {
    // Simulate swarm by smart positioning
    const groups = {};
    data.forEach(r => { const g = String(r[state.x]); if (!groups[g]) groups[g] = []; groups[g].push(r); });
    const cats = Object.keys(groups);
    const traces = [];
    cats.forEach((cat, ci) => {
      const vals = groups[cat].map(r => r[state.y]).filter(v => typeof v === 'number').sort((a, b) => a - b);
      const range = HA().max(vals) - HA().min(vals) || 1;
      const binSize = range / 30;
      const bins = {};
      const xPos = vals.map(v => {
        const binKey = Math.floor(v / binSize);
        bins[binKey] = (bins[binKey] || 0) + 1;
        const offset = (bins[binKey] - 1) * 0.03;
        return ci + (bins[binKey] % 2 === 0 ? offset : -offset);
      });
      traces.push({
        x: xPos, y: vals, mode: 'markers', name: cat, type: 'scatter',
        marker: { size: state.pointSize || 5, color: palette[ci % palette.length], opacity: state.alpha || 0.7 }
      });
    });
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Swarm: ${state.y} by ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, tickvals: cats.map((_, i) => i), ticktext: cats, showgrid: false },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    return `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.swarmplot(data=df, x="${state.x}", y="${state.y}", alpha=${state.alpha || 0.7})\nplt.title("Swarm: ${state.y} by ${state.x}")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [{ icon: '🐝', text: 'Points are positioned to avoid overlap — like a bee swarm' }, { icon: '📊', text: 'Shows the exact distribution shape within each group' }]; }
};

/* ═══════════════════════ POINT PLOT ═══════════════════════ */
MLViz.chartRegistry.point = {
  name: 'Point Plot', category: 'categorical',
  libraries: { seaborn: 'sns.pointplot()', matplotlib: 'plt.errorbar()' },
  description: 'Compare categorical means with confidence intervals.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'Category', options: [...ds.categorical] },
        { type: 'select', id: 'y', label: 'Value', options: ds.numeric },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [
        { type: 'range', id: 'lineWidth', label: 'Line Width', min: 1, max: 5, step: 0.5, default: 2 },
      ],
      analysis: [{ type: 'toggle', id: 'showCI', label: 'Confidence Interval', default: true }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state, palette) {
    const groups = {};
    data.forEach(r => { const g = String(r[state.x]); if (!groups[g]) groups[g] = []; if (typeof r[state.y] === 'number') groups[g].push(r[state.y]); });
    const cats = Object.keys(groups);
    const means = cats.map(c => HA().mean(groups[c]));
    const stds = cats.map(c => HA().std(groups[c]) / Math.sqrt(groups[c].length) * 1.96);
    const traces = [{
      x: cats, y: means, mode: 'lines+markers', name: 'Mean',
      marker: { size: 10, color: palette[0] },
      line: { width: state.lineWidth || 2, color: palette[0] },
      error_y: state.showCI ? { type: 'data', array: stds, visible: true, color: palette[0] } : undefined
    }];
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Mean ${state.y} by ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: false },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: `Mean of ${state.y}`, showgrid: state.grid },
      showlegend: false
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    return `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.pointplot(data=df, x="${state.x}", y="${state.y}"${state.hue !== 'None' ? `, hue="${state.hue}"` : ''})\nplt.title("Mean ${state.y} by ${state.x}")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [{ icon: '📌', text: 'Points show the mean value for each category' }, { icon: '📏', text: 'Error bars show 95% confidence interval' }]; }
};

/* ═══════════════════════ CATPLOT ═══════════════════════ */
MLViz.chartRegistry.catplot = {
  name: 'Catplot Lab', category: 'categorical',
  libraries: { seaborn: 'sns.catplot()', matplotlib: 'N/A' },
  description: 'Interactive categorical lab: switch between strip, swarm, box, violin, bar, point, and count.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'kind', label: 'Chart Kind', options: ['strip', 'swarm', 'box', 'violin', 'bar', 'point', 'count'] },
        { type: 'select', id: 'x', label: 'Category', options: [...ds.categorical, ...ds.numeric] },
        { type: 'select', id: 'y', label: 'Value', options: ['None', ...ds.numeric] },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [{ type: 'range', id: 'alpha', label: 'Alpha', min: 0.3, max: 1, step: 0.1, default: 0.7 }],
      analysis: [], display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() {
    return [
      { id: 'kind_strip', label: '📍 Strip' }, { id: 'kind_box', label: '📦 Box' },
      { id: 'kind_violin', label: '🎻 Violin' }, { id: 'kind_bar', label: '📊 Bar' },
    ];
  },
  render(container, data, state, palette) {
    const kind = state.kind || 'strip';
    const chartDef = MLViz.chartRegistry[kind === 'count' ? 'count' : kind];
    if (chartDef && chartDef.render) {
      chartDef.render(container, data, { ...state, x: state.x, y: state.y || state.x }, palette);
    }
  },
  getCode(lib, state) {
    return `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nsns.catplot(\n    data=df,\n    x="${state.x}",${state.y && state.y !== 'None' ? `\n    y="${state.y}",` : ''}\n    kind="${state.kind || 'strip'}"${state.hue && state.hue !== 'None' ? `,\n    hue="${state.hue}"` : ''}\n)\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [{ icon: '🔄', text: 'Catplot is a meta-function that can create many categorical chart types' }, { icon: '💡', text: 'Change "kind" to switch between strip, swarm, box, violin, bar, point, count' }]; }
};

/* ═══════════════════════ LMPLOT ═══════════════════════ */
MLViz.chartRegistry.lmplot = {
  name: 'LM Plot', category: 'relationship',
  libraries: { seaborn: 'sns.lmplot()', matplotlib: 'plt.scatter() + regression' },
  description: 'Regression plot with faceting by groups — compare relationships across categories.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'X Variable', options: ds.numeric },
        { type: 'select', id: 'y', label: 'Y Variable', options: ds.numeric, default: ds.numeric[1] },
        { type: 'select', id: 'hue', label: 'Hue (Group)', options: ['None', ...ds.categorical] },
      ],
      appearance: [{ type: 'range', id: 'alpha', label: 'Alpha', min: 0.2, max: 1, step: 0.1, default: 0.6 }],
      analysis: [{ type: 'toggle', id: 'ci', label: 'Confidence Interval', default: true }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state, palette) {
    const traces = [];
    if (state.hue && state.hue !== 'None') {
      const groups = {};
      data.forEach(r => { const g = String(r[state.hue]); if (!groups[g]) groups[g] = []; groups[g].push(r); });
      Object.keys(groups).forEach((g, i) => {
        const gx = groups[g].map(r => r[state.x]).filter(v => typeof v === 'number');
        const gy = groups[g].map(r => r[state.y]).filter(v => typeof v === 'number');
        traces.push({
          x: gx, y: gy, mode: 'markers', name: g, type: 'scatter',
          marker: { size: 7, color: palette[i % palette.length], opacity: state.alpha || 0.6 }
        });
        if (gx.length > 2) {
          const reg = HA().linearRegression(gx, gy);
          const xs = HA().linspace(HA().min(gx), HA().max(gx), 50);
          traces.push({
            x: xs, y: xs.map(x => reg.predict(x)), mode: 'lines', name: `${g} fit`,
            line: { color: palette[i % palette.length], width: 2 }, showlegend: false
          });
        }
      });
    } else {
      MLViz.chartRegistry.regplot.render(container, data, state, palette);
      return;
    }
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `LM Plot: ${state.y} ~ ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nsns.lmplot(\n    data=df,\n    x="${state.x}",\n    y="${state.y}"`;
    if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
    if (!state.ci) code += `,\n    ci=None`;
    code += `\n)\nplt.tight_layout()\nplt.show()`;
    return code;
  },
  getExplanation() { return [{ icon: '📈', text: 'Each group gets its own regression line' }, { icon: '🎨', text: 'Compare how the X-Y relationship differs across groups' }]; }
};

/* ═══════════════════════ PAIRPLOT ═══════════════════════ */
MLViz.chartRegistry.pairplot = {
  name: 'Pairplot', category: 'correlation',
  libraries: { seaborn: 'sns.pairplot()', matplotlib: 'plt.subplots() + loops' },
  description: 'Mandatory for EDA: see all pairwise relationships and distributions at once.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.2, max: 1, step: 0.1, default: 0.5 },
        { type: 'select', id: 'diagKind', label: 'Diagonal', options: ['histogram', 'kde'] },
      ],
      analysis: [],
      display: [{ type: 'toggle', id: 'corner', label: 'Corner (half)', default: false, advanced: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state, palette) {
    const ds = MLViz.datasets[window.app ? window.app.state.dataset : 'student'];
    const cols = ds.numeric.slice(0, 4); // Limit to 4 for performance
    const n = cols.length;
    const subplots = [];
    const traces = [];

    // Create subplot grid
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (state.corner && col > row) continue;
        const xaxis = `x${row * n + col + 1 === 1 ? '' : row * n + col + 1}`;
        const yaxis = `y${row * n + col + 1 === 1 ? '' : row * n + col + 1}`;

        if (row === col) {
          // Diagonal: histogram or KDE
          const vals = data.map(r => r[cols[col]]).filter(v => typeof v === 'number');
          traces.push({
            x: vals, type: 'histogram', xaxis, yaxis,
            marker: { color: palette[0] + '88' }, nbinsx: 15, showlegend: false
          });
        } else {
          // Off-diagonal: scatter
          if (state.hue && state.hue !== 'None') {
            const groups = {};
            data.forEach(r => { const g = String(r[state.hue]); if (!groups[g]) groups[g] = []; groups[g].push(r); });
            Object.keys(groups).forEach((g, i) => {
              traces.push({
                x: groups[g].map(r => r[cols[col]]),
                y: groups[g].map(r => r[cols[row]]),
                mode: 'markers', type: 'scatter', xaxis, yaxis,
                name: g, legendgroup: g,
                marker: { size: 4, color: palette[i % palette.length], opacity: state.alpha || 0.5 },
                showlegend: (row === 1 && col === 0) // Show legend once
              });
            });
          } else {
            traces.push({
              x: data.map(r => r[cols[col]]),
              y: data.map(r => r[cols[row]]),
              mode: 'markers', type: 'scatter', xaxis, yaxis,
              marker: { size: 4, color: palette[0], opacity: state.alpha || 0.5 },
              showlegend: false
            });
          }
        }
      }
    }

    // Build grid layout
    const layout = { ...MLViz.ThemeManager.getPlotlyLayout() };
    layout.title = { text: 'Pairplot', font: { size: 14 } };
    layout.grid = { rows: n, columns: n, pattern: 'independent', xgap: 0.04, ygap: 0.04 };
    layout.height = 500;
    layout.showlegend = state.hue !== 'None';
    layout.margin = { t: 40, r: 10, b: 40, l: 40 };

    // Assign axes
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const idx = row * n + col + 1;
        const xKey = idx === 1 ? 'xaxis' : `xaxis${idx}`;
        const yKey = idx === 1 ? 'yaxis' : `yaxis${idx}`;
        layout[xKey] = {
          ...MLViz.ThemeManager.getPlotlyLayout().xaxis,
          title: row === n - 1 ? cols[col] : '',
          showticklabels: row === n - 1,
          tickfont: { size: 9 }
        };
        layout[yKey] = {
          ...MLViz.ThemeManager.getPlotlyLayout().yaxis,
          title: col === 0 ? cols[row] : '',
          showticklabels: col === 0,
          tickfont: { size: 9 }
        };
      }
    }

    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nsns.pairplot(\n    df`;
    if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
    if (state.diagKind === 'kde') code += `,\n    diag_kind="kde"`;
    if (state.corner) code += `,\n    corner=True`;
    code += `\n)\nplt.tight_layout()\nplt.show()`;
    return code;
  },
  getExplanation() { return [
    { icon: '📐', text: 'Diagonal shows the distribution of each variable' },
    { icon: '🔵', text: 'Off-diagonal shows scatter plots for each pair' },
    { icon: '🎨', text: 'Hue colors points by category to reveal group patterns' },
    { icon: '💡', text: 'Essential for Exploratory Data Analysis (EDA) in ML' }
  ]; }
};

/* ═══════════════════════ JOINT PLOT ═══════════════════════ */
MLViz.chartRegistry.jointplot = {
  name: 'Joint Plot', category: 'correlation',
  libraries: { seaborn: 'sns.jointplot()', matplotlib: 'plt.subplots() + margins' },
  description: 'X/Y relationship with marginal distributions on each axis.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'X Variable', options: ds.numeric },
        { type: 'select', id: 'y', label: 'Y Variable', options: ds.numeric, default: ds.numeric[1] },
        { type: 'select', id: 'kind', label: 'Kind', options: ['scatter', 'reg', 'kde', 'hex'] },
      ],
      appearance: [{ type: 'range', id: 'alpha', label: 'Alpha', min: 0.2, max: 1, step: 0.1, default: 0.6 }],
      analysis: [], display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() {
    return [
      { id: 'kind_scatter', label: '🔵 Scatter' }, { id: 'kind_kde', label: '〰️ KDE' },
      { id: 'kind_hex', label: '⬡ Hex' },
    ];
  },
  render(container, data, state, palette) {
    const xData = data.map(r => r[state.x]).filter(v => typeof v === 'number');
    const yData = data.map(r => r[state.y]).filter(v => typeof v === 'number');
    const traces = [];

    // Main plot
    if (state.kind === 'kde') {
      traces.push({
        x: xData, y: yData, type: 'histogram2dcontour', name: 'Density',
        colorscale: 'Viridis', showscale: false, ncontours: 20,
        contours: { coloring: 'heatmap' }
      });
    } else if (state.kind === 'hex') {
      traces.push({
        x: xData, y: yData, type: 'histogram2d', name: 'Hexbin',
        colorscale: 'Viridis', showscale: true, nbinsx: 20, nbinsy: 20
      });
    } else {
      traces.push({
        x: xData, y: yData, mode: 'markers', type: 'scatter', name: 'Data',
        marker: { size: 6, color: palette[0], opacity: state.alpha || 0.6 }
      });
      if (state.kind === 'reg' && xData.length > 2) {
        const reg = HA().linearRegression(xData, yData);
        const xs = HA().linspace(HA().min(xData), HA().max(xData), 100);
        traces.push({ x: xs, y: xs.map(x => reg.predict(x)), mode: 'lines', line: { color: '#ef4444', width: 2 }, showlegend: false });
      }
    }

    // Marginal X (top)
    traces.push({
      x: xData, type: 'histogram', yaxis: 'y2',
      marker: { color: palette[0] + '88' }, nbinsx: 30, showlegend: false
    });
    // Marginal Y (right)
    traces.push({
      y: yData, type: 'histogram', xaxis: 'x2',
      marker: { color: palette[0] + '88' }, nbinsy: 30, showlegend: false
    });

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Joint Plot: ${state.x} vs ${state.y}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, domain: [0, 0.82], showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, domain: [0, 0.82], showgrid: state.grid },
      xaxis2: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, domain: [0.85, 1], showticklabels: false, showgrid: false },
      yaxis2: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, domain: [0.85, 1], showticklabels: false, showgrid: false },
      showlegend: false, bargap: 0.05
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    return `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nsns.jointplot(\n    data=df,\n    x="${state.x}",\n    y="${state.y}",\n    kind="${state.kind || 'scatter'}"\n)\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '🔵', text: 'Center shows X vs Y relationship' },
    { icon: '📊', text: 'Top margin shows X distribution' },
    { icon: '📊', text: 'Right margin shows Y distribution' }
  ]; }
};

/* ═══════════════════════ HEXBIN ═══════════════════════ */
MLViz.chartRegistry.hexbin = {
  name: 'Hexbin Plot', category: 'correlation',
  libraries: { matplotlib: 'plt.hexbin()', seaborn: 'sns.jointplot(kind="hex")' },
  description: 'Group dense scatter data into hexagonal bins for large datasets.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'X Variable', options: ds.numeric },
        { type: 'select', id: 'y', label: 'Y Variable', options: ds.numeric, default: ds.numeric[1] },
      ],
      appearance: [
        { type: 'range', id: 'gridSize', label: 'Grid Size', min: 5, max: 40, step: 1, default: 15 },
        { type: 'select', id: 'colorscale', label: 'Colormap', options: ['Viridis', 'Plasma', 'Inferno', 'Magma', 'YlOrRd', 'Blues'] },
      ],
      analysis: [],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state, palette) {
    const xData = data.map(r => r[state.x]).filter(v => typeof v === 'number');
    const yData = data.map(r => r[state.y]).filter(v => typeof v === 'number');
    const traces = [{
      x: xData, y: yData, type: 'histogram2d',
      colorscale: state.colorscale || 'Viridis',
      nbinsx: state.gridSize || 15, nbinsy: state.gridSize || 15,
      showscale: true
    }];
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Hexbin: ${state.x} vs ${state.y}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'matplotlib') return `import matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nplt.hexbin(df["${state.x}"], df["${state.y}"], gridsize=${state.gridSize || 15}, cmap="${(state.colorscale || 'viridis').toLowerCase()}")\nplt.colorbar(label="Count")\nplt.xlabel("${state.x}")\nplt.ylabel("${state.y}")\nplt.title("Hexbin: ${state.x} vs ${state.y}")\nplt.tight_layout()\nplt.show()`;
    return `import seaborn as sns\n\nsns.jointplot(data=df, x="${state.x}", y="${state.y}", kind="hex")\nplt.show()`;
  },
  getExplanation() { return [{ icon: '⬡', text: '"Hexagons group nearby points so dense areas become easier to see"' }]; }
};

/* ═══════════════════════ CONFUSION MATRIX ═══════════════════════ */
MLViz.chartRegistry.confusion = {
  name: 'Confusion Matrix', category: 'ml-model',
  libraries: { seaborn: 'sns.heatmap()', matplotlib: 'plt.imshow()' },
  description: 'Essential for classification: visualize TP, FP, FN, TN and understand model predictions.',
  getControls() {
    return {
      data: [
        { type: 'range', id: 'tp', label: 'True Positives (TP)', min: 0, max: 100, step: 1, default: 45 },
        { type: 'range', id: 'fp', label: 'False Positives (FP)', min: 0, max: 100, step: 1, default: 8 },
        { type: 'range', id: 'fn', label: 'False Negatives (FN)', min: 0, max: 100, step: 1, default: 12 },
        { type: 'range', id: 'tn', label: 'True Negatives (TN)', min: 0, max: 100, step: 1, default: 35 },
      ],
      appearance: [{ type: 'select', id: 'colorscale', label: 'Color Scale', options: ['Blues', 'Purples', 'Greens', 'YlOrRd', 'Viridis'] }],
      analysis: [{ type: 'toggle', id: 'showMetrics', label: 'Show Metrics', default: true }],
      display: []
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const tp = state.tp || 45, fp = state.fp || 8, fn = state.fn || 12, tn = state.tn || 35;
    const total = tp + fp + fn + tn;
    const accuracy = HA().round((tp + tn) / total, 3);
    const precision = HA().round(tp / (tp + fp || 1), 3);
    const recall = HA().round(tp / (tp + fn || 1), 3);
    const f1 = HA().round(2 * precision * recall / (precision + recall || 1), 3);

    const z = [[tn, fp], [fn, tp]];
    const labels = [['TN', 'FP'], ['FN', 'TP']];
    const text = z.map((row, i) => row.map((v, j) => `${labels[i][j]}<br>${v}`));

    const traces = [{
      z, x: ['Predicted Negative', 'Predicted Positive'], y: ['Actual Negative', 'Actual Positive'],
      type: 'heatmap', colorscale: state.colorscale || 'Blues',
      text, texttemplate: '%{text}', textfont: { size: 18 },
      showscale: false, hoverongaps: false
    }];

    const annotations = [];
    if (state.showMetrics) {
      annotations.push({
        x: 0.5, y: -0.15, xref: 'paper', yref: 'paper',
        text: `Accuracy: ${accuracy}  |  Precision: ${precision}  |  Recall: ${recall}  |  F1: ${f1}`,
        showarrow: false, font: { size: 12, color: '#f59e0b', family: 'JetBrains Mono' }
      });
    }

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Confusion Matrix', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, showgrid: false, side: 'bottom' },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, showgrid: false, autorange: 'reversed' },
      annotations, margin: { t: 50, b: 80, l: 120, r: 20 }
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });

    // Click handler
    const el = document.getElementById('plotly-chart');
    if (el) {
      el.on('plotly_click', (ed) => {
        if (!ed.points[0]) return;
        const pt = ed.points[0];
        const msgs = {
          'Actual Negative-Predicted Negative': 'TN — Model correctly predicted Negative ✅',
          'Actual Negative-Predicted Positive': 'FP — Model predicted Positive but actual was Negative ❌ (Type I Error)',
          'Actual Positive-Predicted Negative': 'FN — Model predicted Negative but actual was Positive ❌ (Type II Error)',
          'Actual Positive-Predicted Positive': 'TP — Model correctly predicted Positive ✅'
        };
        MLViz.toast(msgs[`${pt.y}-${pt.x}`] || '', 3500);
      });
    }
  },
  getCode(lib, state) {
    return `import seaborn as sns\nimport matplotlib.pyplot as plt\nfrom sklearn.metrics import confusion_matrix\n\n# y_true and y_pred from your model\ncm = confusion_matrix(y_true, y_pred)\n\nplt.figure(figsize=(8, 6))\nsns.heatmap(\n    cm,\n    annot=True,\n    fmt="d",\n    cmap="${state.colorscale || 'Blues'}",\n    xticklabels=["Predicted Neg", "Predicted Pos"],\n    yticklabels=["Actual Neg", "Actual Pos"]\n)\nplt.title("Confusion Matrix")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '✅', text: 'TP: Model correctly predicted positive' },
    { icon: '✅', text: 'TN: Model correctly predicted negative' },
    { icon: '❌', text: 'FP: Model predicted positive but was wrong (Type I Error)' },
    { icon: '❌', text: 'FN: Model predicted negative but was wrong (Type II Error)' },
    { icon: '💡', text: 'Click any cell to see what it means!' }
  ]; }
};

/* ═══════════════════════ FEATURE IMPORTANCE ═══════════════════════ */
MLViz.chartRegistry.feature_imp = {
  name: 'Feature Importance', category: 'ml-model',
  libraries: { matplotlib: 'plt.barh()', seaborn: 'sns.barplot()' },
  description: 'Visualize which features matter most to a model.',
  getControls() {
    return {
      data: [
        { type: 'range', id: 'nFeatures', label: 'Number of Features', min: 3, max: 10, step: 1, default: 6 },
      ],
      appearance: [
        { type: 'select', id: 'colorscale', label: 'Color Scheme', options: ['gradient', 'single'] },
        { type: 'color', id: 'color', label: 'Color', default: '#2cbca5' },
      ],
      analysis: [{ type: 'toggle', id: 'showValues', label: 'Show Values', default: true }],
      display: [{ type: 'select', id: 'sortOrder', label: 'Sort', options: ['descending', 'ascending'] }]
    };
  },
  getOperations() { return [{ id: 'sort', label: '↕️ Toggle Sort' }]; },
  render(container, data, state) {
    const n = state.nFeatures || 6;
    const features = ['Age', 'Income', 'Experience', 'Education', 'Hours_Worked', 'Satisfaction', 'Tenure', 'Projects', 'Distance', 'Rating'].slice(0, n);
    let importances = features.map((_, i) => HA().round(0.9 - i * 0.12 + (Math.random() - 0.5) * 0.05, 3));

    if (state.sortOrder === 'ascending') importances = [...importances].sort((a, b) => a - b);
    else importances.sort((a, b) => b - a);

    const sorted = importances.map((v, i) => ({ f: features[i], v }));
    if (state.sortOrder === 'ascending') sorted.sort((a, b) => a.v - b.v);
    else sorted.sort((a, b) => b.v - a.v);
    sorted.reverse(); // For horizontal bar display

    const colors = state.colorscale === 'gradient'
      ? sorted.map((_, i) => `hsl(${250 - i * 25}, 70%, 55%)`)
      : sorted.map(() => state.color || '#2cbca5');

    const traces = [{
      y: sorted.map(s => s.f), x: sorted.map(s => s.v),
      type: 'bar', orientation: 'h',
      marker: { color: colors },
      text: state.showValues ? sorted.map(s => String(s.v)) : undefined,
      textposition: 'outside', textfont: { size: 11 }
    }];

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Feature Importance', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Importance', showgrid: true },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, automargin: true, showgrid: false },
      showlegend: false, bargap: 0.25
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `import matplotlib.pyplot as plt\n\n# After training a model (e.g., Random Forest)\nimportances = model.feature_importances_\nfeature_names = X.columns\n\nsorted_idx = importances.argsort()\n\nplt.figure(figsize=(10, 6))\nplt.barh(feature_names[sorted_idx], importances[sorted_idx])\nplt.xlabel("Importance")\nplt.title("Feature Importance")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [{ icon: '📊', text: 'Longer bars = more important features for the model' }, { icon: '💡', text: 'Use this to decide which features to keep or remove' }]; }
};

/* ═══════════════════════ MODEL PERFORMANCE ═══════════════════════ */
MLViz.chartRegistry.model_perf = {
  name: 'Model Comparison', category: 'ml-model',
  libraries: { matplotlib: 'plt.bar()', seaborn: 'sns.barplot()' },
  description: 'Compare multiple models across different metrics.',
  getControls() {
    return {
      data: [{ type: 'select', id: 'metric', label: 'Primary Metric', options: ['Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC'] }],
      appearance: [], analysis: [], display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state, palette) {
    const models = ['Logistic Reg', 'Random Forest', 'SVM', 'KNN', 'XGBoost'];
    const metrics = {
      Accuracy: [0.82, 0.89, 0.85, 0.78, 0.91],
      Precision: [0.80, 0.87, 0.84, 0.75, 0.90],
      Recall: [0.78, 0.85, 0.82, 0.72, 0.88],
      F1: [0.79, 0.86, 0.83, 0.73, 0.89],
      'ROC-AUC': [0.85, 0.92, 0.88, 0.80, 0.94]
    };
    const vals = metrics[state.metric || 'Accuracy'];
    const traces = [{
      x: models, y: vals, type: 'bar', name: state.metric || 'Accuracy',
      marker: { color: models.map((_, i) => palette[i % palette.length]) },
      text: vals.map(v => v.toFixed(3)), textposition: 'outside'
    }];
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Model Comparison — ${state.metric || 'Accuracy'}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, showgrid: false },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.metric || 'Accuracy', showgrid: state.grid, range: [0, 1.05] },
      showlegend: false, bargap: 0.35
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `import matplotlib.pyplot as plt\n\nmodels = ["Logistic Reg", "Random Forest", "SVM", "KNN", "XGBoost"]\nscores = [0.82, 0.89, 0.85, 0.78, 0.91]  # Replace with your scores\n\nplt.figure(figsize=(10, 6))\nplt.bar(models, scores, color=["#4C72B0", "#DD8452", "#55A868", "#C44E52", "#8172B3"])\nplt.ylabel("Accuracy")\nplt.title("Model Comparison")\nplt.ylim(0, 1.05)\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [{ icon: '🏆', text: 'Compare models side-by-side on the same metric' }, { icon: '📊', text: 'Taller bar = better performance on this metric' }]; }
};

/* ═══════════════════════ ROC CURVE ═══════════════════════ */
MLViz.chartRegistry.roc = {
  name: 'ROC Curve', category: 'ml-model',
  libraries: { matplotlib: 'plt.plot()', seaborn: 'N/A (use sklearn + matplotlib)' },
  description: 'Essential for classification: visualize model performance at all thresholds.',
  getControls() {
    return {
      data: [
        { type: 'range', id: 'auc', label: 'Model AUC', min: 0.5, max: 0.99, step: 0.01, default: 0.88 },
        { type: 'range', id: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.5 },
      ],
      appearance: [{ type: 'color', id: 'color', label: 'Curve Color', default: '#2cbca5' }],
      analysis: [{ type: 'toggle', id: 'showDiagonal', label: 'Show Random Baseline', default: true }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const auc = state.auc || 0.88;
    // Generate ROC curve shape based on AUC
    const n = 100;
    const fpr = HA().linspace(0, 1, n);
    const power = 1 / (auc * 2 - 0.5);
    const tpr = fpr.map(x => Math.pow(x, 1 / Math.max(power, 0.3)));

    const traces = [{
      x: fpr, y: tpr, mode: 'lines', name: `ROC (AUC = ${auc})`,
      line: { color: state.color || '#2cbca5', width: 3 },
      fill: 'tozeroy', fillcolor: (state.color || '#2cbca5') + '18'
    }];

    if (state.showDiagonal) {
      traces.push({
        x: [0, 1], y: [0, 1], mode: 'lines', name: 'Random (AUC = 0.5)',
        line: { color: '#ef4444', width: 1.5, dash: 'dash' }
      });
    }

    // Threshold point
    const thIdx = Math.round(state.threshold * (n - 1));
    traces.push({
      x: [fpr[thIdx]], y: [tpr[thIdx]], mode: 'markers+text', name: `Threshold: ${state.threshold}`,
      marker: { size: 14, color: '#f59e0b', symbol: 'circle', line: { width: 2, color: 'white' } },
      text: [`(${HA().round(fpr[thIdx], 2)}, ${HA().round(tpr[thIdx], 2)})`],
      textposition: 'top right', textfont: { size: 11, color: '#f59e0b' }
    });

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `ROC Curve (AUC = ${auc})`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'False Positive Rate', range: [0, 1], showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'True Positive Rate', range: [0, 1.05], showgrid: state.grid },
      showlegend: true,
      annotations: [{
        x: 0.6, y: 0.2, text: `AUC = ${auc}`, showarrow: false,
        font: { size: 20, color: '#f59e0b', family: 'JetBrains Mono' },
        bgcolor: 'rgba(0,0,0,0.4)', borderpad: 8
      }]
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `from sklearn.metrics import roc_curve, auc\nimport matplotlib.pyplot as plt\n\nfpr, tpr, thresholds = roc_curve(y_true, y_scores)\nroc_auc = auc(fpr, tpr)\n\nplt.figure(figsize=(10, 6))\nplt.plot(fpr, tpr, label=f"ROC (AUC = {roc_auc:.3f})")\nplt.plot([0, 1], [0, 1], "r--", label="Random")\nplt.xlabel("False Positive Rate")\nplt.ylabel("True Positive Rate")\nplt.title("ROC Curve")\nplt.legend()\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '📈', text: 'Curve closer to top-left = better model' },
    { icon: '🔴', text: 'Diagonal = random classifier (AUC = 0.5)' },
    { icon: '🟡', text: 'Moving dot shows current threshold position' },
    { icon: '📐', text: 'AUC = area under curve. Higher = better (max 1.0)' },
    { icon: '💡', text: '"ROC shows how the model changes as we change the classification threshold"' }
  ]; }
};

/* ═══════════════════════ PRECISION-RECALL ═══════════════════════ */
MLViz.chartRegistry.pr_curve = {
  name: 'Precision-Recall', category: 'ml-model',
  libraries: { matplotlib: 'plt.plot()', seaborn: 'N/A' },
  description: 'Important for imbalanced classification — shows precision vs recall tradeoff.',
  getControls() {
    return {
      data: [
        { type: 'range', id: 'quality', label: 'Model Quality', min: 0.3, max: 0.95, step: 0.05, default: 0.8 },
        { type: 'range', id: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.5 },
      ],
      appearance: [{ type: 'color', id: 'color', label: 'Curve Color', default: '#10b981' }],
      analysis: [],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const q = state.quality || 0.8;
    const n = 100;
    const recall = HA().linspace(0.01, 1, n);
    const precision = recall.map(r => q * Math.pow(1 - r * 0.5, 0.8) + (1 - q) * 0.3);

    const traces = [{
      x: recall, y: precision, mode: 'lines', name: 'PR Curve',
      line: { color: state.color || '#10b981', width: 3 },
      fill: 'tozeroy', fillcolor: (state.color || '#10b981') + '18'
    }];

    // Threshold point
    const thIdx = Math.round(state.threshold * (n - 1));
    traces.push({
      x: [recall[thIdx]], y: [precision[thIdx]], mode: 'markers', name: `Threshold: ${state.threshold}`,
      marker: { size: 14, color: '#f59e0b', symbol: 'circle', line: { width: 2, color: 'white' } }
    });

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Precision-Recall Curve', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Recall', range: [0, 1.05], showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Precision', range: [0, 1.05], showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `from sklearn.metrics import precision_recall_curve\nimport matplotlib.pyplot as plt\n\nprecision, recall, thresholds = precision_recall_curve(y_true, y_scores)\n\nplt.figure(figsize=(10, 6))\nplt.plot(recall, precision)\nplt.xlabel("Recall")\nplt.ylabel("Precision")\nplt.title("Precision-Recall Curve")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '📈', text: 'Higher precision = fewer false positives' },
    { icon: '📈', text: 'Higher recall = fewer false negatives' },
    { icon: '⚖️', text: 'Increasing one usually decreases the other — this is the tradeoff' },
    { icon: '💡', text: 'Very important for imbalanced datasets where accuracy can be misleading' }
  ]; }
};

/* ═══════════════════════ LEARNING CURVE ═══════════════════════ */
MLViz.chartRegistry.learning_curve = {
  name: 'Learning Curve', category: 'ml-model',
  libraries: { matplotlib: 'plt.plot()', seaborn: 'N/A' },
  description: 'Essential: diagnose underfitting/overfitting by showing training vs validation scores.',
  getControls() {
    return {
      data: [
        { type: 'select', id: 'scenario', label: 'Scenario', options: ['good_fit', 'underfitting', 'overfitting'] },
      ],
      appearance: [],
      analysis: [{ type: 'range', id: 'noise', label: 'Noise', min: 0, max: 0.1, step: 0.01, default: 0.02 }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }, { type: 'toggle', id: 'showZones', label: 'Show Zones', default: true }]
    };
  },
  getOperations() {
    return [
      { id: 'scenario_good', label: '✅ Good Fit' },
      { id: 'scenario_under', label: '📉 Underfit' },
      { id: 'scenario_over', label: '📈 Overfit' },
    ];
  },
  render(container, data, state) {
    const sizes = [10, 20, 40, 60, 80, 100, 120, 150, 180, 200];
    const noise = state.noise || 0.02;
    let trainScores, valScores;

    if (state.scenario === 'underfitting') {
      trainScores = sizes.map(s => 0.55 + Math.log(s / 10) * 0.05 + HA().randnorm(0, noise));
      valScores = sizes.map(s => 0.5 + Math.log(s / 10) * 0.05 + HA().randnorm(0, noise));
    } else if (state.scenario === 'overfitting') {
      trainScores = sizes.map(() => 0.98 + HA().randnorm(0, noise));
      valScores = sizes.map(s => 0.6 + Math.log(s / 10) * 0.05 + HA().randnorm(0, noise));
    } else {
      trainScores = sizes.map(s => 0.95 - 0.15 * Math.exp(-s / 50) + HA().randnorm(0, noise));
      valScores = sizes.map(s => 0.7 + 0.15 * (1 - Math.exp(-s / 50)) + HA().randnorm(0, noise));
    }

    const traces = [
      { x: sizes, y: trainScores, mode: 'lines+markers', name: 'Training Score', line: { color: '#2cbca5', width: 2.5 }, marker: { size: 7 } },
      { x: sizes, y: valScores, mode: 'lines+markers', name: 'Validation Score', line: { color: '#ef4444', width: 2.5 }, marker: { size: 7 } }
    ];

    const shapes = [];
    if (state.showZones) {
      const gap = trainScores.map((t, i) => t - valScores[i]);
      const avgGap = HA().mean(gap);
      const avgTrain = HA().mean(trainScores);
      let label = '✅ Good Fit', color = '#22c55e';
      if (avgTrain < 0.7) { label = '📉 Underfitting'; color = '#f59e0b'; }
      else if (avgGap > 0.2) { label = '📈 Overfitting'; color = '#ef4444'; }
      traces.push({
        x: [sizes[Math.floor(sizes.length / 2)]], y: [1.02],
        mode: 'text', text: [label], textfont: { size: 16, color }, showlegend: false
      });
    }

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Learning Curve', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Training Size', showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Score', range: [0.3, 1.05], showgrid: state.grid },
      showlegend: true, shapes
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `from sklearn.model_selection import learning_curve\nimport matplotlib.pyplot as plt\nimport numpy as np\n\ntrain_sizes, train_scores, val_scores = learning_curve(\n    model, X, y,\n    train_sizes=np.linspace(0.1, 1.0, 10),\n    cv=5, scoring="accuracy"\n)\n\nplt.figure(figsize=(10, 6))\nplt.plot(train_sizes, train_scores.mean(axis=1), label="Training Score")\nplt.plot(train_sizes, val_scores.mean(axis=1), label="Validation Score")\nplt.xlabel("Training Size")\nplt.ylabel("Score")\nplt.title("Learning Curve")\nplt.legend()\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '🔵', text: 'Training score shows how well the model fits training data' },
    { icon: '🔴', text: 'Validation score shows how well the model generalizes' },
    { icon: '📉', text: 'Both low = Underfitting (model too simple)' },
    { icon: '📈', text: 'Big gap = Overfitting (model too complex)' },
    { icon: '✅', text: 'Both high & converging = Good fit!' }
  ]; }
};

/* ═══════════════════════ VALIDATION CURVE ═══════════════════════ */
MLViz.chartRegistry.validation_curve = {
  name: 'Validation Curve', category: 'ml-model',
  libraries: { matplotlib: 'plt.plot()', seaborn: 'N/A' },
  description: 'Understand how a hyperparameter affects model performance.',
  getControls() {
    return {
      data: [{ type: 'select', id: 'param', label: 'Hyperparameter', options: ['C', 'max_depth', 'n_estimators', 'learning_rate'] }],
      appearance: [], analysis: [],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() { return []; },
  render(container, data, state) {
    const params = { C: [0.01, 0.1, 1, 10, 100], max_depth: [1, 3, 5, 7, 10, 15, 20], n_estimators: [10, 50, 100, 200, 500], learning_rate: [0.001, 0.01, 0.05, 0.1, 0.5, 1.0] };
    const xVals = params[state.param || 'C'];
    const train = xVals.map((_, i) => 0.6 + 0.35 * (1 - Math.exp(-i * 0.5)) + HA().randnorm(0, 0.01));
    const val = xVals.map((_, i) => { const peak = Math.floor(xVals.length * 0.6); return 0.55 + 0.3 * Math.exp(-0.3 * Math.pow(i - peak, 2)) + HA().randnorm(0, 0.015); });
    const traces = [
      { x: xVals, y: train, mode: 'lines+markers', name: 'Training', line: { color: '#2cbca5', width: 2.5 } },
      { x: xVals, y: val, mode: 'lines+markers', name: 'Validation', line: { color: '#ef4444', width: 2.5 } }
    ];
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Validation Curve — ${state.param || 'C'}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.param || 'C', type: 'log', showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Score', showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    return `from sklearn.model_selection import validation_curve\nimport matplotlib.pyplot as plt\nimport numpy as np\n\nparam_range = np.logspace(-2, 2, 5)\ntrain_scores, val_scores = validation_curve(\n    model, X, y,\n    param_name="${state.param || 'C'}",\n    param_range=param_range,\n    cv=5, scoring="accuracy"\n)\n\nplt.figure(figsize=(10, 6))\nplt.semilogx(param_range, train_scores.mean(axis=1), label="Training")\nplt.semilogx(param_range, val_scores.mean(axis=1), label="Validation")\nplt.xlabel("${state.param || 'C'}")\nplt.ylabel("Score")\nplt.title("Validation Curve")\nplt.legend()\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [{ icon: '📐', text: 'Find the sweet spot where validation score is highest' }, { icon: '💡', text: 'Use this to tune hyperparameters for your model' }]; }
};

/* ═══════════════════════ LOSS CURVE ═══════════════════════ */
MLViz.chartRegistry.loss_curve = {
  name: 'Loss Curve', category: 'training',
  libraries: { matplotlib: 'plt.plot()', seaborn: 'N/A' },
  description: 'Essential: monitor training & validation loss across epochs.',
  getControls() {
    return {
      data: [
        { type: 'select', id: 'scenario', label: 'Scenario', options: ['good_fit', 'underfitting', 'overfitting'] },
        { type: 'range', id: 'epochs', label: 'Epochs', min: 10, max: 100, step: 5, default: 50 },
        { type: 'range', id: 'lr', label: 'Learning Rate', min: 0.001, max: 0.5, step: 0.001, default: 0.01 },
      ],
      appearance: [], analysis: [{ type: 'range', id: 'noise', label: 'Noise', min: 0, max: 0.1, step: 0.01, default: 0.02 }],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() {
    return [
      { id: 'scenario_good', label: '✅ Good Fit' },
      { id: 'scenario_under', label: '📉 Underfit' },
      { id: 'scenario_over', label: '📈 Overfit' },
    ];
  },
  render(container, data, state) {
    const nEpochs = state.epochs || 50;
    const lr = state.lr || 0.01;
    const noise = state.noise || 0.02;
    const epochs = Array.from({ length: nEpochs }, (_, i) => i + 1);
    let trainLoss, valLoss;

    if (state.scenario === 'overfitting') {
      trainLoss = epochs.map(e => 0.8 * Math.exp(-lr * e * 3) + 0.02 + HA().randnorm(0, noise));
      valLoss = epochs.map(e => 0.6 * Math.exp(-lr * e * 2) + 0.2 + e * 0.003 + HA().randnorm(0, noise));
    } else if (state.scenario === 'underfitting') {
      trainLoss = epochs.map(e => 0.5 * Math.exp(-lr * e * 0.5) + 0.4 + HA().randnorm(0, noise));
      valLoss = epochs.map(e => 0.5 * Math.exp(-lr * e * 0.4) + 0.45 + HA().randnorm(0, noise));
    } else {
      trainLoss = epochs.map(e => 0.8 * Math.exp(-lr * e * 3) + 0.05 + HA().randnorm(0, noise));
      valLoss = epochs.map(e => 0.7 * Math.exp(-lr * e * 2.5) + 0.08 + HA().randnorm(0, noise));
    }

    const traces = [
      { x: epochs, y: trainLoss, mode: 'lines', name: 'Training Loss', line: { color: '#2cbca5', width: 2.5 } },
      { x: epochs, y: valLoss, mode: 'lines', name: 'Validation Loss', line: { color: '#ef4444', width: 2.5 } }
    ];
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Loss Curve', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Epoch', showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Loss', showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `import matplotlib.pyplot as plt\n\n# history = model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=50)\n\nplt.figure(figsize=(10, 6))\nplt.plot(history.history["loss"], label="Training Loss")\nplt.plot(history.history["val_loss"], label="Validation Loss")\nplt.xlabel("Epoch")\nplt.ylabel("Loss")\nplt.title("Loss Curve")\nplt.legend()\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '🔵', text: 'Training loss should decrease over epochs' },
    { icon: '🔴', text: 'Validation loss should also decrease and stabilize' },
    { icon: '📈', text: 'Val loss going UP while train goes DOWN = overfitting' },
    { icon: '📉', text: 'Both staying HIGH = underfitting' }
  ]; }
};

/* ═══════════════════════ LEARNING RATE VIZ ═══════════════════════ */
MLViz.chartRegistry.lr_viz = {
  name: 'Learning Rate Viz', category: 'training',
  libraries: { matplotlib: 'plt.plot()', seaborn: 'N/A' },
  description: 'See how different learning rates affect convergence.',
  getControls() {
    return {
      data: [{ type: 'select', id: 'lrType', label: 'Learning Rate', options: ['optimal', 'too_small', 'too_large'] }],
      appearance: [], analysis: [],
      display: [{ type: 'toggle', id: 'grid', label: 'Grid', default: true }]
    };
  },
  getOperations() {
    return [
      { id: 'lr_small', label: '🐢 Too Small' },
      { id: 'lr_optimal', label: '✅ Optimal' },
      { id: 'lr_large', label: '💥 Too Large' },
    ];
  },
  render(container, data, state) {
    const epochs = Array.from({ length: 50 }, (_, i) => i + 1);
    const configs = {
      optimal: { lr: 0.05, label: 'Optimal (0.05)', color: '#22c55e' },
      too_small: { lr: 0.001, label: 'Too Small (0.001)', color: '#f59e0b' },
      too_large: { lr: 0.8, label: 'Too Large (0.8)', color: '#ef4444' }
    };
    const traces = Object.entries(configs).map(([key, cfg]) => {
      const loss = epochs.map(e => {
        if (cfg.lr > 0.5) return 0.8 + Math.sin(e * cfg.lr) * 0.3 + HA().randnorm(0, 0.05);
        return 0.9 * Math.exp(-cfg.lr * e * 2) + 0.05 + HA().randnorm(0, 0.01);
      });
      return {
        x: epochs, y: loss, mode: 'lines', name: cfg.label,
        line: { color: cfg.color, width: key === state.lrType ? 3.5 : 1.5, dash: key === state.lrType ? 'solid' : 'dash' }
      };
    });
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Learning Rate Effect on Loss', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Epoch', showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Loss', showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode() {
    return `import matplotlib.pyplot as plt\n\n# Compare training with different learning rates\nfor lr in [0.001, 0.05, 0.8]:\n    model = create_model(learning_rate=lr)\n    history = model.fit(X_train, y_train, epochs=50)\n    plt.plot(history.history["loss"], label=f"LR={lr}")\n\nplt.xlabel("Epoch")\nplt.ylabel("Loss")\nplt.title("Learning Rate Comparison")\nplt.legend()\nplt.show()`;
  },
  getExplanation() { return [
    { icon: '🐢', text: 'Too small LR: very slow convergence, may never reach optimum' },
    { icon: '✅', text: 'Optimal LR: smooth, fast convergence' },
    { icon: '💥', text: 'Too large LR: oscillates or diverges, never converges' }
  ]; }
};
