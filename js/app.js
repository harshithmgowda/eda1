/* ═══════════════════════════════════════════════════════════════════════════
   ML VISUALIZATION PLAYGROUND — MAIN APP CONTROLLER
   State management, event binding, chart rendering pipeline
   ═══════════════════════════════════════════════════════════════════════════ */

window.MLViz = window.MLViz || {};

class App {
  constructor() {
    this.state = {
      library: 'matplotlib',
      chartId: 'line',
      dataset: 'student',
      mode: 'beginner',
      theme: 'dark',
      // Control values (populated per chart)
      x: null, y: null, hue: 'None', sizeVar: 'None',
      color: '#2cbca5', alpha: 0.7, pointSize: 8, lineWidth: 2.5,
      marker: 'circle', lineStyle: 'solid',
      bins: 20, kde: false, regression: false, polyOrder: 1,
      grid: true, legend: true, showMean: false, showMedian: false, showStd: false,
      showCorr: false, ci: true, showScatter: true, showLine: true,
      // Chart-specific defaults
      estimator: 'mean', sortOrder: 'descending', topN: 10,
      showValues: false, showPercent: false, showAnatomy: false, notched: false, showPoints: false,
      showBox: false, fill: true, bandwidth: 1, errorBars: false,
      annotate: true, square: true, colorscale: 'RdBu_r', fontSize: 12,
      highlightStrong: false, vmin: -1, vmax: 1,
      diagKind: 'histogram', corner: false, kind: 'scatter', gridSize: 15,
      // Confusion matrix
      tp: 45, fp: 8, fn: 12, tn: 35, showMetrics: true,
      // Feature importance
      nFeatures: 6,
      // ROC / PR
      auc: 0.88, threshold: 0.5, showDiagonal: true, quality: 0.8,
      // Learning/Loss curves
      scenario: 'good_fit', epochs: 50, lr: 0.01, noise: 0.02, showZones: true,
      // Validation curve
      param: 'C', metric: 'Accuracy',
      // LR viz
      lrType: 'optimal',
      // EDA
      missingPct: 15, transform: 'raw', showKDE: true,
      removeOutliers: false, iqrMultiplier: 1.5,
      // Residual
      pattern: 'random', showZero: true, skew: 0,
      // Subplots
      rows: 2, cols: 2,
      // Multi-axes
      y1: null, y2: null, color1: '#2cbca5', color2: '#ef4444',
      // Catplot
      // Internal
      _mode: 'beginner',
      _sort: null,
      // Style lab
      _theme: 'default', _palette: 'deep', _figWidth: 10, _figHeight: 6, _fontsize: 12
    };

    this.palette = MLViz.palettes.deep;
    this.init();
  }

  init() {
    this.bindHeaderEvents();
    this.bindSidebarEvents();
    this.bindCodePanel();
    this.bindModals();
    this.initDefaults();
    this.selectChart('line');
  }

  initDefaults() {
    const ds = this.getDataset();
    if (ds.numeric.length > 0) this.state.x = ds.numeric[0];
    if (ds.numeric.length > 1) { this.state.y = ds.numeric[1]; this.state.y1 = ds.numeric[0]; this.state.y2 = ds.numeric[1]; }
    if (ds.categorical.length > 0) this.state.hue = 'None';
  }

  getDataset() { return MLViz.datasets[this.state.dataset]; }
  getData() { return this.getDataset().data; }

  /* ─────────── HEADER EVENTS ─────────── */
  bindHeaderEvents() {
    // Library toggle
    document.querySelectorAll('.lib-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lib = btn.dataset.lib;
        this.state.library = lib;
        document.querySelectorAll('.lib-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('library-toggle').dataset.active = lib;
        this.updateApiLabel();
        this.renderChart();
        this.renderCode();
      });
    });

    // Mode toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.mode = btn.dataset.mode;
        this.state._mode = btn.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderControls();
      });
    });

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      MLViz.ThemeManager.toggle();
    });

    // Dataset change
    document.getElementById('dataset-select')?.addEventListener('change', (e) => {
      this.state.dataset = e.target.value;
      this.initDefaults();
      this.renderControls();
      this.renderChart();
      this.renderCode();
    });

    // Workflow button
    document.getElementById('workflow-btn')?.addEventListener('click', () => {
      const modal = document.getElementById('workflow-modal');
      modal.classList.remove('hidden');
      MLViz.Workflow.render();
    });

    // Arcade button
    document.getElementById('arcade-btn')?.addEventListener('click', () => {
      const modal = document.getElementById('arcade-modal');
      modal.classList.remove('hidden');
      MLViz.Arcade.renderMenu();
    });
  }

  /* ─────────── SIDEBAR EVENTS ─────────── */
  bindSidebarEvents() {
    // Category collapse
    document.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('collapsed');
      });
    });

    // Chart selection
    document.querySelectorAll('.chart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectChart(btn.dataset.chart);
      });
    });
  }

  selectChart(chartId) {
    const chart = MLViz.chartRegistry[chartId];
    if (!chart) return;

    this.state.chartId = chartId;

    // Update sidebar active state
    document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.chart-btn[data-chart="${chartId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      // Ensure category is expanded
      const category = activeBtn.closest('.nav-category');
      if (category) category.classList.remove('collapsed');
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Update header info
    this.updateChartInfo(chart);

    // Reset chart-specific defaults
    this.resetChartDefaults(chart);

    // Render
    this.renderOperations(chart);
    this.renderControls();
    this.renderChart();
    this.renderCode();

    // Reset explain mode
    if (MLViz.Explainer.isActive) {
      MLViz.Explainer.isActive = false;
      document.getElementById('explain-btn')?.classList.remove('active');
      document.getElementById('explain-content')?.classList.add('hidden');
    }
  }

  updateChartInfo(chart) {
    const titleEl = document.getElementById('chart-title');
    const apiEl = document.getElementById('chart-api');
    const descEl = document.getElementById('chart-desc');

    if (titleEl) titleEl.textContent = chart.name;
    if (descEl) descEl.textContent = chart.description || '';
    if (apiEl) {
      const libs = chart.libraries || {};
      apiEl.textContent = libs[this.state.library] || Object.values(libs)[0] || '';
    }
  }

  updateApiLabel() {
    const chart = MLViz.chartRegistry[this.state.chartId];
    if (!chart) return;
    const apiEl = document.getElementById('chart-api');
    if (apiEl) {
      const libs = chart.libraries || {};
      apiEl.textContent = libs[this.state.library] || Object.values(libs)[0] || '';
    }
  }

  resetChartDefaults(chart) {
    const ds = this.getDataset();
    if (ds.numeric.length > 0 && !this.state.x) this.state.x = ds.numeric[0];
    if (ds.numeric.length > 1 && !this.state.y) this.state.y = ds.numeric[1];

    // Set smart defaults based on chart type
    const controls = chart.getControls ? chart.getControls(ds) : {};
    const allCtrls = [...(controls.data || []), ...(controls.appearance || []), ...(controls.analysis || []), ...(controls.display || [])];
    allCtrls.forEach(ctrl => {
      if (ctrl.default !== undefined && this.state[ctrl.id] === undefined) {
        this.state[ctrl.id] = ctrl.default;
      }
      // Set first option for selects if current value isn't in options
      if (ctrl.type === 'select' && ctrl.options && ctrl.options.length > 0) {
        const optVals = ctrl.options.map(o => typeof o === 'object' ? o.value : o);
        if (ctrl.id === 'x' || ctrl.id === 'y' || ctrl.id === 'y1' || ctrl.id === 'y2') {
          // For axis variables, pick from dataset columns
          if (!optVals.includes(this.state[ctrl.id])) {
            const defIdx = ctrl.id === 'y' || ctrl.id === 'y2' ? 1 : 0;
            this.state[ctrl.id] = optVals[Math.min(defIdx, optVals.length - 1)];
          }
        }
      }
    });
  }

  /* ─────────── OPERATIONS BAR ─────────── */
  renderOperations(chart) {
    const bar = document.getElementById('operations-bar');
    if (!bar) return;

    const ops = chart.getOperations ? chart.getOperations() : [];
    bar.innerHTML = ops.map(op =>
      `<button class="op-btn" data-op="${op.id}">${op.label}</button>`
    ).join('');

    bar.querySelectorAll('.op-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleOperation(btn.dataset.op);
        btn.classList.toggle('active');
      });
    });
  }

  handleOperation(opId) {
    // Map operations to state changes
    const ops = {
      // Scatter
      add_points: () => { /* Handled by dataset */ },
      add_outliers: () => { /* Handled by dataset */ },
      toggle_regression: () => { this.state.regression = !this.state.regression; },
      show_corr: () => { this.state.showCorr = !this.state.showCorr; },
      // Histogram
      more_bins: () => { this.state.bins = Math.min(60, (this.state.bins || 20) + 5); },
      fewer_bins: () => { this.state.bins = Math.max(5, (this.state.bins || 20) - 5); },
      toggle_kde: () => { this.state.kde = !this.state.kde; },
      show_mean: () => { this.state.showMean = !this.state.showMean; },
      show_median: () => { this.state.showMedian = !this.state.showMedian; },
      // Box
      show_anatomy: () => { this.state.showAnatomy = !this.state.showAnatomy; },
      highlight_outliers: () => { this.state.showPoints = !this.state.showPoints; },
      show_iqr: () => { this.state.showAnatomy = !this.state.showAnatomy; },
      // Bar
      sort_asc: () => { this.state._sort = this.state._sort === 'asc' ? null : 'asc'; this.state.sortOrder = 'ascending'; },
      sort_desc: () => { this.state._sort = this.state._sort === 'desc' ? null : 'desc'; this.state.sortOrder = 'descending'; },
      show_values: () => { this.state.showValues = !this.state.showValues; },
      // Heatmap
      highlight_strong: () => { this.state.highlightStrong = !this.state.highlightStrong; },
      toggle_values: () => { this.state.annotate = !this.state.annotate; },
      // Learning/Loss curve scenarios
      scenario_good: () => { this.state.scenario = 'good_fit'; },
      scenario_under: () => { this.state.scenario = 'underfitting'; },
      scenario_over: () => { this.state.scenario = 'overfitting'; },
      // LR Viz
      lr_small: () => { this.state.lrType = 'too_small'; },
      lr_optimal: () => { this.state.lrType = 'optimal'; },
      lr_large: () => { this.state.lrType = 'too_large'; },
      // Outlier lab
      toggle_outliers: () => { this.state.removeOutliers = !this.state.removeOutliers; },
      // Catplot
      kind_strip: () => { this.state.kind = 'strip'; },
      kind_box: () => { this.state.kind = 'box'; },
      kind_violin: () => { this.state.kind = 'violin'; },
      kind_bar: () => { this.state.kind = 'bar'; },
      // Joint plot
      kind_scatter: () => { this.state.kind = 'scatter'; },
      kind_kde: () => { this.state.kind = 'kde'; },
      kind_hex: () => { this.state.kind = 'hex'; },
      // Regression
      linear: () => { this.state.polyOrder = 1; },
      quadratic: () => { this.state.polyOrder = 2; },
      cubic: () => { this.state.polyOrder = 3; },
      // Subplots
      grid_1x2: () => { this.state.rows = 1; this.state.cols = 2; },
      grid_2x2: () => { this.state.rows = 2; this.state.cols = 2; },
      grid_2x3: () => { this.state.rows = 2; this.state.cols = 3; },
      // Dist compare
      transform_log: () => { this.state.transform = 'log'; },
      transform_std: () => { this.state.transform = 'standardize'; },
      transform_sqrt: () => { this.state.transform = 'sqrt'; },
      // Sort toggle
      sort: () => { this.state.sortOrder = this.state.sortOrder === 'descending' ? 'ascending' : 'descending'; },
    };

    if (ops[opId]) ops[opId]();
    this.renderControls();
    this.renderChart();
    this.renderCode();
  }

  /* ─────────── CONTROLS PANEL ─────────── */
  renderControls() {
    const chart = MLViz.chartRegistry[this.state.chartId];
    if (!chart || !chart.getControls) return;

    const ds = this.getDataset();
    const controls = chart.getControls(ds);

    const sections = {
      data: document.querySelector('[data-section-body="data"]'),
      appearance: document.querySelector('[data-section-body="appearance"]'),
      analysis: document.querySelector('[data-section-body="analysis"]'),
      display: document.querySelector('[data-section-body="display"]'),
      style: document.querySelector('[data-section-body="style"]'),
    };

    const onChange = (id, value) => {
      this.state[id] = value;
      this.renderChart();
      this.renderCode();
      if (MLViz.Explainer.isActive) MLViz.Explainer.show();
    };

    // Render each section
    Object.entries(sections).forEach(([key, el]) => {
      if (!el) return;
      if (key === 'style') {
        this.renderStyleLab(el, onChange);
        return;
      }
      const ctrls = controls[key] || [];
      MLViz.ControlBuilder.render(el, ctrls, this.state, onChange);
    });

    // Show/hide empty sections
    Object.keys(sections).forEach(key => {
      const section = document.getElementById(`ctrl-${key}`);
      if (!section) return;
      const ctrls = key === 'style' ? [1] : (controls[key] || []);
      const visible = ctrls.length > 0;
      section.style.display = visible ? '' : 'none';
    });
  }

  renderStyleLab(container, onChange) {
    const controls = [
      { type: 'select', id: '_theme', label: 'Theme', options: Object.keys(MLViz.themes) },
      { type: 'select', id: '_palette', label: 'Palette', options: Object.keys(MLViz.palettes) },
    ];
    MLViz.ControlBuilder.render(container, controls, this.state, (id, value) => {
      this.state[id] = value;
      if (id === '_palette') this.palette = MLViz.palettes[value] || MLViz.palettes.deep;
      this.renderChart();
      this.renderCode();
    });
  }

  /* ─────────── CHART RENDERING ─────────── */
  renderChart() {
    const chart = MLViz.chartRegistry[this.state.chartId];
    if (!chart || !chart.render) return;

    const container = document.getElementById('plotly-chart');
    if (!container) return;

    try {
      const data = this.getData();
      chart.render(container, data, this.state, this.palette);
    } catch (err) {
      container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:var(--text-sm);">Could not render this chart. Try a different dataset or variable.</div>`;
    }
  }

  /* ─────────── CODE GENERATION ─────────── */
  renderCode() {
    const chart = MLViz.chartRegistry[this.state.chartId];
    if (!chart || !chart.getCode) return;

    const code = chart.getCode(this.state.library, this.state, this.state.dataset);
    MLViz.CodeGen.updatePanel(code, this.state.library);
  }

  /* ─────────── CODE PANEL ─────────── */
  bindCodePanel() {
    document.getElementById('copy-code-btn')?.addEventListener('click', () => {
      const code = document.getElementById('python-code')?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copy-code-btn');
        btn.classList.add('copied');
        btn.querySelector('.copy-text').textContent = 'Copied!';
        MLViz.toast('Code copied to clipboard!');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.querySelector('.copy-text').textContent = 'Copy';
        }, 2000);
      }).catch(() => {
        MLViz.toast('Failed to copy. Select and copy manually.');
      });
    });
  }

  /* ─────────── MODALS ─────────── */
  bindModals() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        document.getElementById(modalId)?.classList.add('hidden');
      });
    });

    // Backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', () => {
        backdrop.parentElement?.classList.add('hidden');
      });
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
      }
    });
  }

  /* ─────────── EXPLAIN MODE ─────────── */
  bindExplainMode() {
    document.getElementById('explain-btn')?.addEventListener('click', () => {
      MLViz.Explainer.toggle();
    });
  }
}

/* ─────────── BOOTSTRAP ─────────── */
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.bindExplainMode();

  // Control section collapse
  document.querySelectorAll('.control-section-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
});
