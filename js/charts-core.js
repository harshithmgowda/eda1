/* ═══════════════════════════════════════════════════════════════════════════
   ML VISUALIZATION PLAYGROUND — CORE CHARTS
   Line, Scatter, Bar, HBar, Histogram, Box, Violin, KDE, Count, Regplot
   ═══════════════════════════════════════════════════════════════════════════ */

window.MLViz = window.MLViz || {};
MLViz.chartRegistry = MLViz.chartRegistry || {};
const H = () => MLViz.helpers;
const P = () => MLViz.palettes;

/* ═══════════════════════ 1. LINE PLOT ═══════════════════════ */
MLViz.chartRegistry.line = {
  name: 'Line Plot',
  category: 'basic',
  libraries: { matplotlib: 'plt.plot()', seaborn: 'sns.lineplot()' },
  description: 'Visualize trends, time series, training curves, and loss curves.',
  getControls(ds) {
    const num = ds.numeric;
    return {
      data: [
        { type: 'select', id: 'x', label: 'X Variable', options: ds.columns },
        { type: 'select', id: 'y', label: 'Y Variable', options: num, default: num[1] || num[0] },
        { type: 'select', id: 'hue', label: 'Hue (Group)', options: ['None', ...ds.categorical] }
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Color', default: '#2cbca5' },
        { type: 'range', id: 'lineWidth', label: 'Line Width', min: 1, max: 8, step: 0.5, default: 2.5 },
        { type: 'select', id: 'lineStyle', label: 'Line Style', options: ['solid', 'dash', 'dot', 'dashdot'] },
        { type: 'select', id: 'marker', label: 'Marker', options: ['none', 'circle', 'square', 'diamond', 'cross', 'triangle-up'] },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.1, max: 1, step: 0.1, default: 1 },
      ],
      analysis: [
        { type: 'toggle', id: 'ci', label: 'Confidence Interval', advanced: true },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
        { type: 'toggle', id: 'legend', label: 'Legend', default: true },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'add_noise', label: '〰️ Add Noise' },
      { id: 'smooth', label: '📈 Smooth' },
    ];
  },
  render(container, data, state, palette) {
    const x = data.map(r => r[state.x]);
    const y = data.map(r => r[state.y]);

    // Sort by x for line chart
    const pairs = x.map((v, i) => ({ x: v, y: y[i] })).sort((a, b) => {
      if (typeof a.x === 'number') return a.x - b.x;
      return String(a.x).localeCompare(String(b.x));
    });

    const traces = [];

    if (state.hue && state.hue !== 'None') {
      const groups = {};
      data.forEach(r => {
        const g = r[state.hue];
        if (!groups[g]) groups[g] = [];
        groups[g].push(r);
      });
      Object.keys(groups).forEach((g, i) => {
        const gd = groups[g].sort((a, b) => {
          if (typeof a[state.x] === 'number') return a[state.x] - b[state.x];
          return String(a[state.x]).localeCompare(String(b[state.x]));
        });
        traces.push({
          x: gd.map(r => r[state.x]),
          y: gd.map(r => r[state.y]),
          name: String(g),
          mode: state.marker !== 'none' ? 'lines+markers' : 'lines',
          line: { width: state.lineWidth || 2.5, dash: state.lineStyle || 'solid', color: palette[i % palette.length] },
          marker: state.marker !== 'none' ? { symbol: state.marker, size: 6 } : undefined,
          opacity: state.alpha || 1
        });
      });
    } else {
      traces.push({
        x: pairs.map(p => p.x),
        y: pairs.map(p => p.y),
        mode: state.marker !== 'none' ? 'lines+markers' : 'lines',
        line: { width: state.lineWidth || 2.5, dash: state.lineStyle || 'solid', color: state.color || '#2cbca5' },
        marker: state.marker !== 'none' ? { symbol: state.marker, size: 6, color: state.color || '#2cbca5' } : undefined,
        opacity: state.alpha || 1,
        name: state.y
      });
    }

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `${state.y} vs ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
      showlegend: state.legend
    };
    Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['lasso2d', 'select2d'] });
  },
  getCode(lib, state, dsName) {
    if (lib === 'matplotlib') {
      let code = `import matplotlib.pyplot as plt\nimport pandas as pd\n\n# df = pd.read_csv("${dsName}.csv")\n\nplt.figure(figsize=(10, 6))\nplt.plot(df["${state.x}"], df["${state.y}"]`;
      if (state.color) code += `,\n        color="${state.color}"`;
      if (state.lineWidth) code += `,\n        linewidth=${state.lineWidth}`;
      if (state.lineStyle && state.lineStyle !== 'solid') code += `,\n        linestyle="${state.lineStyle === 'dash' ? '--' : state.lineStyle === 'dot' ? ':' : '-.'}"`;
      if (state.marker && state.marker !== 'none') code += `,\n        marker="o"`;
      if (state.alpha < 1) code += `,\n        alpha=${state.alpha}`;
      code += `)\nplt.xlabel("${state.x}")\nplt.ylabel("${state.y}")`;
      if (state.grid) code += `\nplt.grid(True, alpha=0.3)`;
      code += `\nplt.title("${state.y} vs ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    } else {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\n# df = pd.read_csv("${dsName}.csv")\n\nplt.figure(figsize=(10, 6))\nsns.lineplot(\n    data=df,\n    x="${state.x}",\n    y="${state.y}"`;
      if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
      if (state.lineStyle && state.lineStyle !== 'solid') code += `,\n    linestyle="${state.lineStyle === 'dash' ? '--' : state.lineStyle === 'dot' ? ':' : '-.'}"`;
      code += `\n)\nplt.title("${state.y} vs ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
  },
  getExplanation() {
    return [
      { icon: '➡️', text: 'X-axis shows the independent or time variable' },
      { icon: '⬆️', text: 'Y-axis shows the measured value or metric' },
      { icon: '📈', text: 'The line connects data points to show trends' },
      { icon: '🔵', text: 'Markers (if shown) represent individual observations' },
      { icon: '🎨', text: 'Different colors represent different groups (when Hue is set)' }
    ];
  }
};

/* ═══════════════════════ 2. SCATTER PLOT ═══════════════════════ */
MLViz.chartRegistry.scatter = {
  name: 'Scatter Plot',
  category: 'basic',
  libraries: { matplotlib: 'plt.scatter()', seaborn: 'sns.scatterplot()' },
  description: 'Essential for ML: visualize feature relationships, correlations, outliers, and clusters.',
  getControls(ds) {
    const num = ds.numeric;
    return {
      data: [
        { type: 'select', id: 'x', label: 'X Variable', options: num },
        { type: 'select', id: 'y', label: 'Y Variable', options: num, default: num[1] || num[0] },
        { type: 'select', id: 'hue', label: 'Hue (Color)', options: ['None', ...ds.categorical, ...num] },
        { type: 'select', id: 'sizeVar', label: 'Size Variable', options: ['None', ...num], advanced: true },
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Color', default: '#2cbca5' },
        { type: 'range', id: 'pointSize', label: 'Point Size', min: 3, max: 20, step: 1, default: 8 },
        { type: 'select', id: 'marker', label: 'Marker', options: ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'star'] },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.1, max: 1, step: 0.1, default: 0.7 },
      ],
      analysis: [
        { type: 'toggle', id: 'regression', label: 'Regression Line' },
        { type: 'select', id: 'polyOrder', label: 'Polynomial Order', options: [1, 2, 3, 4], default: 1, advanced: true },
        { type: 'toggle', id: 'showCorr', label: 'Show Correlation' },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
        { type: 'toggle', id: 'legend', label: 'Legend', default: true },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'add_points', label: '➕ Add Points' },
      { id: 'add_outliers', label: '⚠️ Add Outliers' },
      { id: 'toggle_regression', label: '📈 Regression' },
      { id: 'show_corr', label: '🔗 Correlation' },
    ];
  },
  render(container, data, state, palette) {
    const xData = data.map(r => r[state.x]).filter(v => typeof v === 'number');
    const yData = data.map(r => r[state.y]).filter(v => typeof v === 'number');
    const traces = [];

    if (state.hue && state.hue !== 'None') {
      const groups = {};
      data.forEach(r => {
        const g = String(r[state.hue]);
        if (!groups[g]) groups[g] = [];
        groups[g].push(r);
      });
      Object.keys(groups).forEach((g, i) => {
        traces.push({
          x: groups[g].map(r => r[state.x]),
          y: groups[g].map(r => r[state.y]),
          mode: 'markers',
          type: 'scatter',
          name: g,
          marker: {
            size: state.pointSize || 8,
            symbol: state.marker || 'circle',
            opacity: state.alpha || 0.7,
            color: palette[i % palette.length]
          }
        });
      });
    } else {
      traces.push({
        x: xData,
        y: yData,
        mode: 'markers',
        type: 'scatter',
        name: 'Data',
        marker: {
          size: state.pointSize || 8,
          symbol: state.marker || 'circle',
          opacity: state.alpha || 0.7,
          color: state.color || '#2cbca5'
        }
      });
    }

    // Regression line
    if (state.regression) {
      const numX = data.map(r => r[state.x]).filter(v => typeof v === 'number');
      const numY = data.map(r => r[state.y]).filter(v => typeof v === 'number');
      if (numX.length > 1) {
        const order = parseInt(state.polyOrder) || 1;
        const reg = order === 1 ? H().linearRegression(numX, numY) : H().polynomialRegression(numX, numY, order);
        const xs = H().linspace(H().min(numX), H().max(numX), 100);
        const ys = xs.map(x => reg.predict(x));
        traces.push({
          x: xs, y: ys, mode: 'lines', name: `Regression (order ${order})`,
          line: { color: '#ef4444', width: 2.5, dash: 'solid' }
        });
      }
    }

    // Correlation annotation
    const annotations = [];
    if (state.showCorr) {
      const numX = data.map(r => r[state.x]).filter(v => typeof v === 'number');
      const numY = data.map(r => r[state.y]).filter(v => typeof v === 'number');
      if (numX.length > 1) {
        const r = H().pearsonR(numX, numY);
        const rStr = H().round(r, 3);
        const strength = Math.abs(r) > 0.7 ? 'Strong' : Math.abs(r) > 0.4 ? 'Moderate' : 'Weak';
        const dir = r > 0 ? 'positive' : r < 0 ? 'negative' : 'no';
        annotations.push({
          x: 0.02, y: 0.98, xref: 'paper', yref: 'paper',
          text: `r = ${rStr} (${strength} ${dir})`,
          showarrow: false,
          font: { size: 13, color: '#f59e0b', family: 'JetBrains Mono' },
          bgcolor: 'rgba(0,0,0,0.5)', borderpad: 6, bordercolor: '#f59e0b', borderwidth: 1
        });
      }
    }

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `${state.y} vs ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
      showlegend: state.legend,
      annotations
    };
    Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['lasso2d', 'select2d'] });
  },
  getCode(lib, state, dsName) {
    if (lib === 'matplotlib') {
      let code = `import matplotlib.pyplot as plt\nimport pandas as pd\n\n# df = pd.read_csv("${dsName}.csv")\n\nplt.figure(figsize=(10, 6))\nplt.scatter(\n    df["${state.x}"],\n    df["${state.y}"]`;
      if (state.color) code += `,\n    c="${state.color}"`;
      if (state.alpha < 1) code += `,\n    alpha=${state.alpha}`;
      if (state.pointSize) code += `,\n    s=${state.pointSize * 10}`;
      if (state.marker && state.marker !== 'circle') code += `,\n    marker="${state.marker[0]}"`;
      code += `\n)\nplt.xlabel("${state.x}")\nplt.ylabel("${state.y}")`;
      if (state.grid) code += `\nplt.grid(True, alpha=0.3)`;
      code += `\nplt.title("${state.y} vs ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    } else {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.scatterplot(\n    data=df,\n    x="${state.x}",\n    y="${state.y}"`;
      if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
      if (state.sizeVar && state.sizeVar !== 'None') code += `,\n    size="${state.sizeVar}"`;
      if (state.alpha < 1) code += `,\n    alpha=${state.alpha}`;
      code += `\n)\nplt.title("${state.y} vs ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
  },
  getExplanation() {
    return [
      { icon: '🔵', text: 'Each point represents one observation in the dataset' },
      { icon: '➡️', text: 'X-axis: independent variable (feature)' },
      { icon: '⬆️', text: 'Y-axis: dependent variable (target/outcome)' },
      { icon: '📈', text: 'Upward trend = positive correlation' },
      { icon: '📉', text: 'Downward trend = negative correlation' },
      { icon: '⚠️', text: 'Points far from cluster = potential outliers' },
      { icon: '🎨', text: 'Colors can represent different categories or groups' }
    ];
  }
};

/* ═══════════════════════ 3. BAR PLOT ═══════════════════════ */
MLViz.chartRegistry.bar = {
  name: 'Bar Plot',
  category: 'basic',
  libraries: { matplotlib: 'plt.bar()', seaborn: 'sns.barplot()' },
  description: 'Compare categories, feature importance, or model performance.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'X (Category)', options: [...ds.categorical, ...ds.numeric] },
        { type: 'select', id: 'y', label: 'Y (Value)', options: ds.numeric },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
        { type: 'select', id: 'estimator', label: 'Estimator', options: ['mean', 'sum', 'count', 'median'] },
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Color', default: '#2cbca5' },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.3, max: 1, step: 0.1, default: 0.85 },
      ],
      analysis: [
        { type: 'toggle', id: 'errorBars', label: 'Error Bars', advanced: true },
        { type: 'toggle', id: 'showValues', label: 'Show Values' },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
        { type: 'toggle', id: 'legend', label: 'Legend', default: true },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'sort_asc', label: '↑ Sort Ascending' },
      { id: 'sort_desc', label: '↓ Sort Descending' },
      { id: 'show_values', label: '🔢 Show Values' },
    ];
  },
  render(container, data, state, palette) {
    const estFn = {
      mean: H().mean, sum: (arr) => arr.reduce((a,b) => a+b, 0),
      count: (arr) => arr.length, median: H().median
    }[state.estimator || 'mean'];

    const groups = {};
    data.forEach(r => {
      const cat = String(r[state.x]);
      if (!groups[cat]) groups[cat] = [];
      if (typeof r[state.y] === 'number') groups[cat].push(r[state.y]);
    });

    let categories = Object.keys(groups);
    let values = categories.map(c => H().round(estFn(groups[c]), 2));

    // Sort if operation active
    if (state._sort === 'asc') {
      const pairs = categories.map((c, i) => ({ c, v: values[i] })).sort((a, b) => a.v - b.v);
      categories = pairs.map(p => p.c);
      values = pairs.map(p => p.v);
    } else if (state._sort === 'desc') {
      const pairs = categories.map((c, i) => ({ c, v: values[i] })).sort((a, b) => b.v - a.v);
      categories = pairs.map(p => p.c);
      values = pairs.map(p => p.v);
    }

    const traces = [{
      x: categories, y: values, type: 'bar', name: state.y,
      marker: { color: state.color || '#2cbca5', opacity: state.alpha || 0.85 },
      text: state.showValues ? values.map(v => String(v)) : undefined,
      textposition: 'outside',
      textfont: { size: 11 }
    }];

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `${state.y} by ${state.x} (${state.estimator || 'mean'})`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: false },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: `${state.estimator || 'mean'} of ${state.y}`, showgrid: state.grid },
      showlegend: state.legend,
      bargap: 0.3
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state, dsName) {
    if (lib === 'matplotlib') {
      return `import matplotlib.pyplot as plt\nimport pandas as pd\n\ndf_grouped = df.groupby("${state.x}")["${state.y}"].${state.estimator || 'mean'}()\n\nplt.figure(figsize=(10, 6))\nplt.bar(\n    df_grouped.index,\n    df_grouped.values,\n    color="${state.color || '#2cbca5'}",\n    alpha=${state.alpha || 0.85}\n)\nplt.xlabel("${state.x}")\nplt.ylabel("${state.estimator || 'mean'} of ${state.y}")\nplt.title("${state.y} by ${state.x}")\nplt.tight_layout()\nplt.show()`;
    } else {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.barplot(\n    data=df,\n    x="${state.x}",\n    y="${state.y}"`;
      if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
      code += `,\n    estimator="${state.estimator || 'mean'}"`;
      code += `\n)\nplt.title("${state.y} by ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
  },
  getExplanation() {
    return [
      { icon: '📊', text: 'Each bar represents a category or group' },
      { icon: '⬆️', text: 'Bar height shows the value (mean, sum, count, etc.)' },
      { icon: '🎨', text: 'Colors can split bars by a grouping variable' },
      { icon: '📐', text: 'Error bars show uncertainty in the estimate' }
    ];
  }
};

/* ═══════════════════════ 4. HORIZONTAL BAR ═══════════════════════ */
MLViz.chartRegistry.hbar = {
  name: 'Horizontal Bar Plot',
  category: 'basic',
  libraries: { matplotlib: 'plt.barh()', seaborn: 'sns.barplot(orient="h")' },
  description: 'Perfect for feature importance, ranked variables, and top-N comparisons.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'y', label: 'Category', options: [...ds.categorical, ...ds.numeric] },
        { type: 'select', id: 'x', label: 'Value', options: ds.numeric },
        { type: 'select', id: 'estimator', label: 'Estimator', options: ['mean', 'sum', 'count', 'median'] },
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Color', default: '#22d3ee' },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.3, max: 1, step: 0.1, default: 0.85 },
      ],
      analysis: [
        { type: 'toggle', id: 'showValues', label: 'Show Values' },
        { type: 'range', id: 'topN', label: 'Top N', min: 3, max: 20, step: 1, default: 10 },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
        { type: 'select', id: 'sortOrder', label: 'Sort', options: ['descending', 'ascending', 'none'] },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'sort_asc', label: '↑ Ascending' },
      { id: 'sort_desc', label: '↓ Descending' },
      { id: 'show_values', label: '🔢 Values' },
    ];
  },
  render(container, data, state, palette) {
    const estFn = {
      mean: H().mean, sum: (arr) => arr.reduce((a,b) => a+b, 0),
      count: (arr) => arr.length, median: H().median
    }[state.estimator || 'mean'];

    const groups = {};
    data.forEach(r => {
      const cat = String(r[state.y]);
      if (!groups[cat]) groups[cat] = [];
      if (typeof r[state.x] === 'number') groups[cat].push(r[state.x]);
    });

    let categories = Object.keys(groups);
    let values = categories.map(c => H().round(estFn(groups[c]), 2));

    // Sort
    const pairs = categories.map((c, i) => ({ c, v: values[i] }));
    if (state.sortOrder === 'ascending') pairs.sort((a, b) => a.v - b.v);
    else if (state.sortOrder !== 'none') pairs.sort((a, b) => b.v - a.v);

    // Top N
    const topN = Math.min(state.topN || 10, pairs.length);
    const sliced = pairs.slice(0, topN).reverse();

    const colors = sliced.map((_, i) => {
      const t = i / (sliced.length - 1 || 1);
      return `hsl(${180 + t * 60}, 70%, 55%)`;
    });

    const traces = [{
      y: sliced.map(p => p.c), x: sliced.map(p => p.v), type: 'bar', orientation: 'h',
      marker: { color: colors, opacity: state.alpha || 0.85 },
      text: state.showValues ? sliced.map(p => String(p.v)) : undefined,
      textposition: 'outside', textfont: { size: 11 }
    }];

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `${state.x} by ${state.y} (Top ${topN})`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: `${state.estimator || 'mean'} of ${state.x}`, showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: '', showgrid: false, automargin: true },
      showlegend: false, bargap: 0.25
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'matplotlib') {
      return `import matplotlib.pyplot as plt\nimport pandas as pd\n\ndf_grouped = df.groupby("${state.y}")["${state.x}"].${state.estimator || 'mean'}()\ndf_sorted = df_grouped.sort_values(ascending=${state.sortOrder === 'ascending'})\ndf_top = df_sorted.tail(${state.topN || 10})\n\nplt.figure(figsize=(10, 6))\nplt.barh(\n    df_top.index,\n    df_top.values,\n    color="${state.color || '#22d3ee'}"\n)\nplt.xlabel("${state.estimator || 'mean'} of ${state.x}")\nplt.title("${state.x} by ${state.y}")\nplt.tight_layout()\nplt.show()`;
    } else {
      return `import seaborn as sns\nimport matplotlib.pyplot as plt\n\ndf_grouped = df.groupby("${state.y}")["${state.x}"].${state.estimator || 'mean'}().reset_index()\ndf_sorted = df_grouped.sort_values("${state.x}", ascending=${state.sortOrder === 'ascending'}).tail(${state.topN || 10})\n\nplt.figure(figsize=(10, 6))\nsns.barplot(\n    data=df_sorted,\n    y="${state.y}",\n    x="${state.x}",\n    orient="h"\n)\nplt.title("${state.x} by ${state.y}")\nplt.tight_layout()\nplt.show()`;
    }
  },
  getExplanation() {
    return [
      { icon: '📊', text: 'Horizontal bars make long category names readable' },
      { icon: '➡️', text: 'Bar length represents the value' },
      { icon: '🏆', text: 'Great for ranking features by importance' }
    ];
  }
};

/* ═══════════════════════ 5. HISTOGRAM ═══════════════════════ */
MLViz.chartRegistry.histogram = {
  name: 'Histogram',
  category: 'basic',
  libraries: { matplotlib: 'plt.hist()', seaborn: 'sns.histplot()' },
  description: 'Essential for ML: understand distributions, detect skewness, and analyze features before modeling.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'Variable', options: ds.numeric },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Color', default: '#3dd4bc' },
        { type: 'range', id: 'bins', label: 'Bins', min: 5, max: 60, step: 1, default: 20 },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.2, max: 1, step: 0.1, default: 0.7 },
      ],
      analysis: [
        { type: 'toggle', id: 'kde', label: 'KDE Overlay' },
        { type: 'toggle', id: 'showMean', label: 'Show Mean' },
        { type: 'toggle', id: 'showMedian', label: 'Show Median' },
        { type: 'toggle', id: 'showStd', label: 'Show Std Dev', advanced: true },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'more_bins', label: '➕ More Bins' },
      { id: 'fewer_bins', label: '➖ Fewer Bins' },
      { id: 'toggle_kde', label: '〰️ KDE' },
      { id: 'show_mean', label: '📍 Mean' },
      { id: 'show_median', label: '📍 Median' },
    ];
  },
  render(container, data, state, palette) {
    const vals = data.map(r => r[state.x]).filter(v => typeof v === 'number');
    const traces = [];

    if (state.hue && state.hue !== 'None') {
      const groups = {};
      data.forEach(r => { const g = r[state.hue]; if (!groups[g]) groups[g] = []; if (typeof r[state.x] === 'number') groups[g].push(r[state.x]); });
      Object.keys(groups).forEach((g, i) => {
        traces.push({
          x: groups[g], type: 'histogram', name: g,
          nbinsx: state.bins || 20,
          marker: { color: palette[i % palette.length], opacity: state.alpha || 0.7 },
          opacity: state.alpha || 0.7
        });
      });
    } else {
      traces.push({
        x: vals, type: 'histogram', name: state.x,
        nbinsx: state.bins || 20,
        marker: { color: state.color || '#3dd4bc', opacity: state.alpha || 0.7 }
      });
    }

    // KDE overlay
    if (state.kde && vals.length > 2) {
      const kdeData = H().kde(vals);
      // Scale KDE to match histogram
      const binWidth = (H().max(vals) - H().min(vals)) / (state.bins || 20);
      const scaledY = kdeData.y.map(v => v * vals.length * binWidth);
      traces.push({
        x: kdeData.x, y: scaledY, mode: 'lines', name: 'KDE',
        line: { color: '#f59e0b', width: 2.5 }, yaxis: 'y'
      });
    }

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Distribution of ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Count', showgrid: state.grid },
      barmode: 'overlay',
      showlegend: true,
      shapes: [],
      annotations: []
    };

    // Mean / Median lines
    if (state.showMean) {
      const m = H().mean(vals);
      layout.shapes.push({ type: 'line', x0: m, x1: m, y0: 0, y1: 1, yref: 'paper', line: { color: '#ef4444', width: 2, dash: 'dash' } });
      layout.annotations.push({ x: m, y: 1.02, yref: 'paper', text: `Mean: ${H().round(m, 2)}`, showarrow: false, font: { color: '#ef4444', size: 11 } });
    }
    if (state.showMedian) {
      const m = H().median(vals);
      layout.shapes.push({ type: 'line', x0: m, x1: m, y0: 0, y1: 1, yref: 'paper', line: { color: '#22c55e', width: 2, dash: 'dash' } });
      layout.annotations.push({ x: m, y: 0.96, yref: 'paper', text: `Median: ${H().round(m, 2)}`, showarrow: false, font: { color: '#22c55e', size: 11 } });
    }
    if (state.showStd) {
      const m = H().mean(vals), s = H().std(vals);
      layout.shapes.push(
        { type: 'line', x0: m - s, x1: m - s, y0: 0, y1: 1, yref: 'paper', line: { color: '#f97316', width: 1.5, dash: 'dot' } },
        { type: 'line', x0: m + s, x1: m + s, y0: 0, y1: 1, yref: 'paper', line: { color: '#f97316', width: 1.5, dash: 'dot' } }
      );
    }

    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'matplotlib') {
      let code = `import matplotlib.pyplot as plt\nimport numpy as np\n\nplt.figure(figsize=(10, 6))\nplt.hist(\n    df["${state.x}"],\n    bins=${state.bins || 20},\n    color="${state.color || '#3dd4bc'}",\n    alpha=${state.alpha || 0.7},\n    edgecolor="white"\n)`;
      if (state.showMean) code += `\nplt.axvline(df["${state.x}"].mean(), color="red", linestyle="--", label="Mean")`;
      if (state.showMedian) code += `\nplt.axvline(df["${state.x}"].median(), color="green", linestyle="--", label="Median")`;
      code += `\nplt.xlabel("${state.x}")\nplt.ylabel("Count")\nplt.title("Distribution of ${state.x}")`;
      if (state.showMean || state.showMedian) code += `\nplt.legend()`;
      code += `\nplt.tight_layout()\nplt.show()`;
      return code;
    } else {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.histplot(\n    data=df,\n    x="${state.x}",\n    bins=${state.bins || 20}`;
      if (state.kde) code += `,\n    kde=True`;
      if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
      code += `,\n    alpha=${state.alpha || 0.7}\n)\nplt.title("Distribution of ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
  },
  getExplanation() {
    return [
      { icon: '📊', text: 'Each bar (bin) shows how many data points fall within a range' },
      { icon: '➡️', text: 'X-axis: the variable values' },
      { icon: '⬆️', text: 'Y-axis: count of observations in each bin' },
      { icon: '🔴', text: 'Mean line (red): average value' },
      { icon: '🟢', text: 'Median line (green): middle value' },
      { icon: '〰️', text: 'KDE curve: smooth estimate of the distribution shape' },
      { icon: '📐', text: 'Skewed right = tail extends right; Skewed left = tail extends left' }
    ];
  }
};

/* ═══════════════════════ 6. BOX PLOT ═══════════════════════ */
MLViz.chartRegistry.box = {
  name: 'Box Plot',
  category: 'basic',
  libraries: { matplotlib: 'plt.boxplot()', seaborn: 'sns.boxplot()' },
  description: 'Essential for ML: detect outliers, compare distributions, and understand data spread.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'Category (X)', options: ['None', ...ds.categorical, ...ds.numeric] },
        { type: 'select', id: 'y', label: 'Value (Y)', options: ds.numeric },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Color', default: '#06b6d4' },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.3, max: 1, step: 0.1, default: 0.7 },
      ],
      analysis: [
        { type: 'toggle', id: 'showAnatomy', label: 'Show Anatomy' },
        { type: 'toggle', id: 'notched', label: 'Notched', advanced: true },
        { type: 'toggle', id: 'showPoints', label: 'Show All Points', advanced: true },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'show_anatomy', label: '📐 Anatomy' },
      { id: 'highlight_outliers', label: '⚠️ Outliers' },
      { id: 'show_iqr', label: '📦 IQR' },
    ];
  },
  render(container, data, state, palette) {
    const traces = [];
    const vals = data.map(r => r[state.y]).filter(v => typeof v === 'number');

    if (state.x && state.x !== 'None') {
      const groups = {};
      data.forEach(r => {
        const g = String(r[state.x]);
        if (!groups[g]) groups[g] = [];
        if (typeof r[state.y] === 'number') groups[g].push(r[state.y]);
      });
      Object.keys(groups).forEach((g, i) => {
        traces.push({
          y: groups[g], type: 'box', name: g,
          marker: { color: palette[i % palette.length], outliercolor: '#ef4444' },
          boxpoints: state.showPoints ? 'all' : 'outliers',
          jitter: 0.3, pointpos: -1.5,
          fillcolor: palette[i % palette.length] + '99',
          line: { color: palette[i % palette.length] },
          notched: state.notched || false
        });
      });
    } else {
      traces.push({
        y: vals, type: 'box', name: state.y,
        marker: { color: state.color || '#06b6d4', outliercolor: '#ef4444' },
        boxpoints: state.showPoints ? 'all' : 'outliers',
        jitter: 0.3, pointpos: -1.5,
        fillcolor: (state.color || '#06b6d4') + '88',
        line: { color: state.color || '#06b6d4' },
        notched: state.notched || false
      });
    }

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: state.x !== 'None' ? `${state.y} by ${state.x}` : `Distribution of ${state.y}`, font: { size: 14 } },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
      showlegend: true,
      annotations: []
    };

    // Anatomy annotations
    if (state.showAnatomy && vals.length > 0) {
      const q = H().quartiles(vals);
      const iqr = q.q3 - q.q1;
      const whiskerLo = Math.max(H().min(vals), q.q1 - 1.5 * iqr);
      const whiskerHi = Math.min(H().max(vals), q.q3 + 1.5 * iqr);
      const anns = [
        { y: q.q2, text: `Median: ${H().round(q.q2, 1)}` },
        { y: q.q1, text: `Q1: ${H().round(q.q1, 1)}` },
        { y: q.q3, text: `Q3: ${H().round(q.q3, 1)}` },
        { y: whiskerLo, text: `Min whisker: ${H().round(whiskerLo, 1)}` },
        { y: whiskerHi, text: `Max whisker: ${H().round(whiskerHi, 1)}` },
      ];
      anns.forEach(a => {
        layout.annotations.push({
          x: 1.15, xref: 'paper', y: a.y,
          text: a.text, showarrow: true, arrowhead: 2, ax: 40, ay: 0,
          font: { size: 10, color: '#f59e0b' }, arrowcolor: '#f59e0b'
        });
      });
    }

    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'matplotlib') {
      return `import matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nplt.boxplot(\n    df["${state.y}"],\n    patch_artist=True,\n    boxprops=dict(facecolor="${state.color || '#06b6d4'}88")\n)\nplt.ylabel("${state.y}")\nplt.title("Box Plot of ${state.y}")\nplt.tight_layout()\nplt.show()`;
    } else {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.boxplot(\n    data=df`;
      if (state.x && state.x !== 'None') code += `,\n    x="${state.x}"`;
      code += `,\n    y="${state.y}"`;
      if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
      code += `\n)\nplt.title("Box Plot of ${state.y}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
  },
  getExplanation() {
    return [
      { icon: '📦', text: 'The box shows the interquartile range (IQR) — middle 50% of data' },
      { icon: '➖', text: 'Line inside the box = Median (50th percentile)' },
      { icon: '📐', text: 'Bottom of box = Q1 (25th percentile), Top = Q3 (75th percentile)' },
      { icon: '📏', text: 'Whiskers extend to 1.5 × IQR from the box edges' },
      { icon: '⚠️', text: 'Points beyond whiskers are outliers' },
      { icon: '💡', text: 'Taller box = more spread; Asymmetric = skewed distribution' }
    ];
  }
};

/* ═══════════════════════ 7. VIOLIN PLOT ═══════════════════════ */
MLViz.chartRegistry.violin = {
  name: 'Violin Plot',
  category: 'basic',
  libraries: { matplotlib: 'plt.violinplot()', seaborn: 'sns.violinplot()' },
  description: 'See distribution shape and density for comparing groups.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'Category (X)', options: ['None', ...ds.categorical] },
        { type: 'select', id: 'y', label: 'Value (Y)', options: ds.numeric },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.3, max: 1, step: 0.1, default: 0.7 },
      ],
      analysis: [
        { type: 'toggle', id: 'showBox', label: 'Show Box Inside' },
        { type: 'toggle', id: 'showPoints', label: 'Show Points', advanced: true },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
      ]
    };
  },
  getOperations() { return []; },
  render(container, data, state, palette) {
    const traces = [];
    if (state.x && state.x !== 'None') {
      const groups = {};
      data.forEach(r => { const g = String(r[state.x]); if (!groups[g]) groups[g] = []; if (typeof r[state.y] === 'number') groups[g].push(r[state.y]); });
      Object.keys(groups).forEach((g, i) => {
        traces.push({
          y: groups[g], type: 'violin', name: g,
          box: { visible: state.showBox || false },
          meanline: { visible: true },
          fillcolor: palette[i % palette.length] + '88',
          line: { color: palette[i % palette.length] },
          points: state.showPoints ? 'all' : false,
          jitter: 0.3
        });
      });
    } else {
      const vals = data.map(r => r[state.y]).filter(v => typeof v === 'number');
      traces.push({
        y: vals, type: 'violin', name: state.y,
        box: { visible: state.showBox || false },
        meanline: { visible: true },
        fillcolor: '#3dd4bc88', line: { color: '#3dd4bc' },
        points: state.showPoints ? 'all' : false
      });
    }
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Violin Plot of ${state.y}`, font: { size: 14 } },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'seaborn') {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.violinplot(\n    data=df`;
      if (state.x && state.x !== 'None') code += `,\n    x="${state.x}"`;
      code += `,\n    y="${state.y}"`;
      if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
      if (state.showBox) code += `,\n    inner="box"`;
      code += `\n)\nplt.title("Violin Plot of ${state.y}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
    return `import matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nplt.violinplot(df["${state.y}"].dropna(), showmeans=True)\nplt.ylabel("${state.y}")\nplt.title("Violin Plot of ${state.y}")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() {
    return [
      { icon: '🎻', text: 'Width shows density — wider = more data points at that value' },
      { icon: '➖', text: 'Dashed line inside = mean value' },
      { icon: '📦', text: 'Optional inner box shows quartiles like a box plot' },
      { icon: '📊', text: 'Great for comparing distribution shapes across groups' }
    ];
  }
};

/* ═══════════════════════ 8. KDE PLOT ═══════════════════════ */
MLViz.chartRegistry.kde = {
  name: 'KDE Plot',
  category: 'basic',
  libraries: { matplotlib: 'plt.plot() + KDE', seaborn: 'sns.kdeplot()' },
  description: 'Kernel Density Estimation — smooth distribution curve for comparing distributions.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'Variable', options: ds.numeric },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Color', default: '#f43f5e' },
        { type: 'range', id: 'lineWidth', label: 'Line Width', min: 1, max: 5, step: 0.5, default: 2.5 },
        { type: 'range', id: 'alpha', label: 'Fill Alpha', min: 0, max: 0.8, step: 0.1, default: 0.3 },
      ],
      analysis: [
        { type: 'range', id: 'bandwidth', label: 'Bandwidth', min: 0.1, max: 5, step: 0.1, default: 1 },
        { type: 'toggle', id: 'fill', label: 'Fill Under Curve', default: true },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
      ]
    };
  },
  getOperations() { return []; },
  render(container, data, state, palette) {
    const traces = [];
    if (state.hue && state.hue !== 'None') {
      const groups = {};
      data.forEach(r => { const g = r[state.hue]; if (!groups[g]) groups[g] = []; if (typeof r[state.x] === 'number') groups[g].push(r[state.x]); });
      Object.keys(groups).forEach((g, i) => {
        const kd = H().kde(groups[g], state.bandwidth || undefined);
        traces.push({
          x: kd.x, y: kd.y, mode: 'lines', name: g,
          line: { color: palette[i % palette.length], width: state.lineWidth || 2.5 },
          fill: state.fill ? 'tozeroy' : undefined,
          fillcolor: palette[i % palette.length] + '44'
        });
      });
    } else {
      const vals = data.map(r => r[state.x]).filter(v => typeof v === 'number');
      const kd = H().kde(vals, state.bandwidth || undefined);
      traces.push({
        x: kd.x, y: kd.y, mode: 'lines', name: state.x,
        line: { color: state.color || '#f43f5e', width: state.lineWidth || 2.5 },
        fill: state.fill ? 'tozeroy' : undefined,
        fillcolor: (state.color || '#f43f5e') + '44'
      });
    }
    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `KDE of ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Density', showgrid: state.grid },
      showlegend: true
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'seaborn') {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.kdeplot(\n    data=df,\n    x="${state.x}"`;
      if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
      if (state.fill) code += `,\n    fill=True, alpha=${state.alpha || 0.3}`;
      if (state.bandwidth !== 1) code += `,\n    bw_adjust=${state.bandwidth}`;
      code += `\n)\nplt.title("KDE of ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
    return `import numpy as np\nfrom scipy.stats import gaussian_kde\nimport matplotlib.pyplot as plt\n\ndata = df["${state.x}"].dropna()\nkde = gaussian_kde(data, bw_method=${state.bandwidth || 'None'})\nx_range = np.linspace(data.min(), data.max(), 200)\n\nplt.figure(figsize=(10, 6))\nplt.plot(x_range, kde(x_range), color="${state.color || '#f43f5e'}",\n         linewidth=${state.lineWidth || 2.5})\n${state.fill ? 'plt.fill_between(x_range, kde(x_range), alpha=0.3)\n' : ''}plt.xlabel("${state.x}")\nplt.ylabel("Density")\nplt.title("KDE of ${state.x}")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() {
    return [
      { icon: '〰️', text: 'KDE is a smoothed version of a histogram' },
      { icon: '📐', text: 'Higher curve = more data points in that region' },
      { icon: '🎚️', text: 'Bandwidth controls smoothness: low = detailed, high = smooth' },
      { icon: '🔄', text: 'Great for comparing distributions across groups' }
    ];
  }
};

/* ═══════════════════════ 9. COUNT PLOT ═══════════════════════ */
MLViz.chartRegistry.count = {
  name: 'Count Plot',
  category: 'categorical',
  libraries: { matplotlib: 'plt.bar() + value_counts()', seaborn: 'sns.countplot()' },
  description: 'Count observations in each category — essential for detecting class imbalance.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'Category', options: [...ds.categorical, ...ds.numeric] },
        { type: 'select', id: 'hue', label: 'Hue', options: ['None', ...ds.categorical] },
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Color', default: '#10b981' },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.3, max: 1, step: 0.1, default: 0.85 },
        { type: 'select', id: 'palette', label: 'Palette', options: Object.keys(P()) },
      ],
      analysis: [
        { type: 'toggle', id: 'showValues', label: 'Show Counts' },
        { type: 'toggle', id: 'showPercent', label: 'Show Percentage' },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'show_values', label: '🔢 Show Counts' },
      { id: 'sort', label: '↓ Sort by Count' },
    ];
  },
  render(container, data, state, palette) {
    const counts = {};
    data.forEach(r => { const v = String(r[state.x]); counts[v] = (counts[v] || 0) + 1; });
    const cats = Object.keys(counts);
    const vals = cats.map(c => counts[c]);
    const total = vals.reduce((a, b) => a + b, 0);
    const colors = cats.map((_, i) => palette[i % palette.length]);

    const textArr = state.showValues
      ? vals.map(v => state.showPercent ? `${v} (${H().round(v / total * 100, 1)}%)` : String(v))
      : undefined;

    const traces = [{
      x: cats, y: vals, type: 'bar', name: 'Count',
      marker: { color: colors, opacity: state.alpha || 0.85 },
      text: textArr, textposition: 'outside', textfont: { size: 11 }
    }];

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Count of ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: false },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Count', showgrid: state.grid },
      showlegend: false, bargap: 0.3
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'seaborn') {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.countplot(\n    data=df,\n    x="${state.x}"`;
      if (state.hue && state.hue !== 'None') code += `,\n    hue="${state.hue}"`;
      code += `\n)\nplt.title("Count of ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
    return `import matplotlib.pyplot as plt\n\ncounts = df["${state.x}"].value_counts()\n\nplt.figure(figsize=(10, 6))\nplt.bar(counts.index, counts.values, color="${state.color || '#10b981'}")\nplt.xlabel("${state.x}")\nplt.ylabel("Count")\nplt.title("Count of ${state.x}")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() {
    return [
      { icon: '📊', text: 'Countplot counts how many observations are in each category' },
      { icon: '⚖️', text: 'Equal bars = balanced classes; Unequal = imbalanced' },
      { icon: '⚠️', text: 'Class imbalance can significantly affect ML model performance' },
      { icon: '💡', text: 'Use this to check target distribution before training a classifier' }
    ];
  }
};

/* ═══════════════════════ 10. REGRESSION PLOT ═══════════════════════ */
MLViz.chartRegistry.regplot = {
  name: 'Regression Plot',
  category: 'relationship',
  libraries: { matplotlib: 'plt.scatter() + np.polyfit()', seaborn: 'sns.regplot()' },
  description: 'Visualize the relationship between X and Y with a regression line and confidence interval.',
  getControls(ds) {
    return {
      data: [
        { type: 'select', id: 'x', label: 'X Variable', options: ds.numeric },
        { type: 'select', id: 'y', label: 'Y Variable', options: ds.numeric, default: ds.numeric[1] },
      ],
      appearance: [
        { type: 'color', id: 'color', label: 'Point Color', default: '#2cbca5' },
        { type: 'range', id: 'pointSize', label: 'Point Size', min: 3, max: 15, step: 1, default: 7 },
        { type: 'range', id: 'alpha', label: 'Alpha', min: 0.1, max: 1, step: 0.1, default: 0.6 },
      ],
      analysis: [
        { type: 'select', id: 'polyOrder', label: 'Polynomial Order', options: [1, 2, 3, 4], default: 1 },
        { type: 'toggle', id: 'ci', label: 'Confidence Interval', default: true },
        { type: 'toggle', id: 'showScatter', label: 'Show Points', default: true },
        { type: 'toggle', id: 'showLine', label: 'Show Regression Line', default: true },
        { type: 'toggle', id: 'showCorr', label: 'Show Correlation' },
      ],
      display: [
        { type: 'toggle', id: 'grid', label: 'Grid', default: true },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'linear', label: '📏 Linear' },
      { id: 'quadratic', label: '📐 Quadratic' },
      { id: 'cubic', label: '〰️ Cubic' },
    ];
  },
  render(container, data, state, palette) {
    const xData = data.map(r => r[state.x]).filter(v => typeof v === 'number');
    const yData = data.map(r => r[state.y]).filter(v => typeof v === 'number');
    const traces = [];

    // Scatter
    if (state.showScatter !== false) {
      traces.push({
        x: xData, y: yData, mode: 'markers', name: 'Data', type: 'scatter',
        marker: { size: state.pointSize || 7, color: state.color || '#2cbca5', opacity: state.alpha || 0.6 }
      });
    }

    // Regression
    if (state.showLine !== false && xData.length > 1) {
      const order = parseInt(state.polyOrder) || 1;
      const reg = order === 1 ? H().linearRegression(xData, yData) : H().polynomialRegression(xData, yData, order);
      const xs = H().linspace(H().min(xData), H().max(xData), 100);
      const ys = xs.map(x => reg.predict(x));
      traces.push({
        x: xs, y: ys, mode: 'lines', name: `Regression (order ${order})`,
        line: { color: '#ef4444', width: 3 }
      });

      // Confidence interval (bootstrap approximation)
      if (state.ci) {
        const residuals = xData.map((x, i) => yData[i] - reg.predict(x));
        const se = H().std(residuals);
        const upper = ys.map(y => y + 1.96 * se);
        const lower = ys.map(y => y - 1.96 * se);
        traces.push({
          x: [...xs, ...xs.reverse()],
          y: [...upper, ...lower.reverse()],
          fill: 'toself', fillcolor: 'rgba(239,68,68,0.12)',
          line: { color: 'transparent' }, name: '95% CI', showlegend: true
        });
      }
    }

    const annotations = [];
    if (state.showCorr && xData.length > 1) {
      const r = H().pearsonR(xData, yData);
      const r2 = r * r;
      annotations.push({
        x: 0.02, y: 0.98, xref: 'paper', yref: 'paper',
        text: `r = ${H().round(r, 3)}  |  R² = ${H().round(r2, 3)}`,
        showarrow: false,
        font: { size: 13, color: '#f59e0b', family: 'JetBrains Mono' },
        bgcolor: 'rgba(0,0,0,0.5)', borderpad: 6
      });
    }

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: `Regression: ${state.y} ~ ${state.x}`, font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: state.x, showgrid: state.grid },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: state.y, showgrid: state.grid },
      showlegend: true, annotations
    };
    Plotly.newPlot(container, traces, layout, { responsive: true });
  },
  getCode(lib, state) {
    if (lib === 'seaborn') {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nsns.regplot(\n    data=df,\n    x="${state.x}",\n    y="${state.y}"`;
      const order = parseInt(state.polyOrder) || 1;
      if (order > 1) code += `,\n    order=${order}`;
      if (!state.ci) code += `,\n    ci=None`;
      if (!state.showScatter) code += `,\n    scatter=False`;
      code += `,\n    scatter_kws={"alpha": ${state.alpha || 0.6}, "s": ${(state.pointSize || 7) * 8}}`;
      code += `\n)\nplt.title("Regression: ${state.y} ~ ${state.x}")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
    return `import matplotlib.pyplot as plt\nimport numpy as np\n\nx = df["${state.x}"]\ny = df["${state.y}"]\n\nplt.figure(figsize=(10, 6))\nplt.scatter(x, y, alpha=${state.alpha || 0.6})\n\n# Fit polynomial\ncoeffs = np.polyfit(x, y, ${state.polyOrder || 1})\npoly = np.poly1d(coeffs)\nx_line = np.linspace(x.min(), x.max(), 100)\nplt.plot(x_line, poly(x_line), color="red", linewidth=2)\n\nplt.xlabel("${state.x}")\nplt.ylabel("${state.y}")\nplt.title("Regression: ${state.y} ~ ${state.x}")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() {
    return [
      { icon: '🔵', text: 'Each point represents one data observation' },
      { icon: '📈', text: 'The red line shows the best-fit relationship' },
      { icon: '🔴', text: 'Shaded area = 95% confidence interval' },
      { icon: '📊', text: 'r = Pearson correlation (-1 to +1)' },
      { icon: '📐', text: 'R² = how much variance in Y is explained by X' },
      { icon: '💡', text: '"The line shows the general relationship between X and Y"' }
    ];
  }
};

/* ═══════════════════════ 11. HEATMAP ═══════════════════════ */
MLViz.chartRegistry.heatmap = {
  name: 'Heatmap',
  category: 'correlation',
  libraries: { matplotlib: 'plt.imshow()', seaborn: 'sns.heatmap()' },
  description: 'Mandatory for ML: visualize correlation matrices, confusion matrices, and feature relationships.',
  getControls(ds) {
    return {
      data: [],
      appearance: [
        { type: 'select', id: 'colorscale', label: 'Color Scale', options: ['RdBu_r', 'Viridis', 'Plasma', 'Inferno', 'YlOrRd', 'Blues', 'Greens', 'Purples', 'Spectral'] },
        { type: 'range', id: 'fontSize', label: 'Annotation Size', min: 8, max: 16, step: 1, default: 12 },
      ],
      analysis: [
        { type: 'toggle', id: 'annotate', label: 'Show Values', default: true },
        { type: 'toggle', id: 'square', label: 'Square Cells', default: true },
        { type: 'toggle', id: 'highlightStrong', label: 'Highlight Strong Correlations' },
      ],
      display: [
        { type: 'range', id: 'vmin', label: 'Min Value', min: -1, max: 0, step: 0.1, default: -1, advanced: true },
        { type: 'range', id: 'vmax', label: 'Max Value', min: 0, max: 1, step: 0.1, default: 1, advanced: true },
      ]
    };
  },
  getOperations() {
    return [
      { id: 'highlight_strong', label: '🔍 Strongest' },
      { id: 'highlight_weak', label: '🔍 Weakest' },
      { id: 'toggle_values', label: '🔢 Values' },
    ];
  },
  render(container, data, state, palette) {
    const ds = MLViz.datasets[window.app ? window.app.state.dataset : 'student'];
    const numCols = ds.numeric;
    if (numCols.length < 2) return;

    const matrix = H().corrMatrix(data, numCols);
    const textMatrix = matrix.map(row => row.map(v => H().round(v, 2)));

    const traces = [{
      z: matrix,
      x: numCols, y: numCols,
      type: 'heatmap',
      colorscale: state.colorscale || 'RdBu_r',
      zmin: state.vmin !== undefined ? state.vmin : -1,
      zmax: state.vmax !== undefined ? state.vmax : 1,
      text: state.annotate ? textMatrix : undefined,
      texttemplate: state.annotate ? '%{text}' : '',
      textfont: { size: state.fontSize || 12 },
      hoverongaps: false,
      showscale: true
    }];

    const layout = {
      ...MLViz.ThemeManager.getPlotlyLayout(),
      title: { text: 'Correlation Matrix', font: { size: 14 } },
      xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, showgrid: false, side: 'bottom' },
      yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, showgrid: false, autorange: 'reversed' },
      width: undefined,
      height: undefined,
      annotations: []
    };

    if (state.square) {
      layout.yaxis.scaleanchor = 'x';
      layout.yaxis.scaleratio = 1;
    }

    Plotly.newPlot(container, traces, layout, { responsive: true });

    // Add click handler for cell info
    const el = document.getElementById('plotly-chart');
    if (el) {
      el.on('plotly_click', (eventData) => {
        if (eventData.points && eventData.points[0]) {
          const pt = eventData.points[0];
          const r = H().round(pt.z, 3);
          const strength = Math.abs(r) > 0.7 ? 'Strong' : Math.abs(r) > 0.4 ? 'Moderate' : 'Weak';
          const dir = r > 0 ? 'positive' : r < 0 ? 'negative' : 'no';
          MLViz.toast(`${pt.x} ↔ ${pt.y}: r = ${r} (${strength} ${dir} correlation)`, 3000);
        }
      });
    }
  },
  getCode(lib, state) {
    if (lib === 'seaborn') {
      let code = `import seaborn as sns\nimport matplotlib.pyplot as plt\n\ncorr = df.select_dtypes(include="number").corr()\n\nplt.figure(figsize=(10, 8))\nsns.heatmap(\n    corr`;
      if (state.annotate) code += `,\n    annot=True, fmt=".2f"`;
      code += `,\n    cmap="${state.colorscale || 'RdBu_r'}"`;
      code += `,\n    vmin=${state.vmin ?? -1}, vmax=${state.vmax ?? 1}`;
      if (state.square) code += `,\n    square=True`;
      code += `,\n    linewidths=0.5`;
      code += `\n)\nplt.title("Correlation Matrix")\nplt.tight_layout()\nplt.show()`;
      return code;
    }
    return `import matplotlib.pyplot as plt\nimport numpy as np\n\ncorr = df.select_dtypes(include="number").corr()\n\nfig, ax = plt.subplots(figsize=(10, 8))\nim = ax.imshow(corr, cmap="${state.colorscale || 'RdBu_r'}", vmin=-1, vmax=1)\nax.set_xticks(range(len(corr.columns)))\nax.set_yticks(range(len(corr.columns)))\nax.set_xticklabels(corr.columns, rotation=45)\nax.set_yticklabels(corr.columns)\nplt.colorbar(im)\nplt.title("Correlation Matrix")\nplt.tight_layout()\nplt.show()`;
  },
  getExplanation() {
    return [
      { icon: '🟥', text: 'Red/warm colors = positive correlation (both increase together)' },
      { icon: '🟦', text: 'Blue/cool colors = negative correlation (one increases, other decreases)' },
      { icon: '⬜', text: 'White/neutral = no correlation' },
      { icon: '🔢', text: 'Values range from -1 (perfect negative) to +1 (perfect positive)' },
      { icon: '💡', text: 'Click any cell to see the exact correlation and interpretation' },
      { icon: '⚠️', text: 'High correlation between features may indicate redundancy (multicollinearity)' }
    ];
  }
};
