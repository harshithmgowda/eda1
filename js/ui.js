/* ═══════════════════════════════════════════════════════════════════════════
   ML VISUALIZATION PLAYGROUND — UI MODULE
   Control builder, Python code generator, theme manager, and explainer
   ═══════════════════════════════════════════════════════════════════════════ */

window.MLViz = window.MLViz || {};

/* ─────────────────────── CONTROL BUILDER ─────────────────────── */
MLViz.ControlBuilder = {
  /**
   * Render a control definition into a section body.
   * @param {HTMLElement} container - The section body element
   * @param {Array} controls - Array of control definitions
   * @param {Object} state - Current control values
   * @param {Function} onChange - Callback when a control changes: (id, value) => {}
   */
  render(container, controls, state, onChange) {
    container.innerHTML = '';
    if (!controls || !controls.length) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:var(--text-xs);padding:4px 0;">No controls for this section</div>';
      return;
    }

    controls.forEach(ctrl => {
      if (ctrl.advanced && state._mode === 'beginner') return;

      const group = document.createElement('div');
      group.className = 'control-group';

      switch (ctrl.type) {
        case 'select':
          group.innerHTML = `
            <div class="control-label">${ctrl.label}</div>
            <select class="ctrl-select" data-ctrl="${ctrl.id}">
              ${(ctrl.options || []).map(o => {
                const val = typeof o === 'object' ? o.value : o;
                const label = typeof o === 'object' ? o.label : o;
                const selected = String(state[ctrl.id]) === String(val) ? 'selected' : '';
                return `<option value="${val}" ${selected}>${label}</option>`;
              }).join('')}
            </select>`;
          const sel = group.querySelector('select');
          sel.addEventListener('change', () => onChange(ctrl.id, sel.value));
          break;

        case 'range':
          const val = state[ctrl.id] !== undefined ? state[ctrl.id] : ctrl.default;
          group.innerHTML = `
            <div class="control-label">
              <span>${ctrl.label}</span>
              <span class="control-value" data-val="${ctrl.id}">${val}</span>
            </div>
            <input type="range" class="ctrl-range" data-ctrl="${ctrl.id}"
              min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${val}">`;
          const range = group.querySelector('input[type=range]');
          range.addEventListener('input', () => {
            const v = parseFloat(range.value);
            group.querySelector('.control-value').textContent = v;
            onChange(ctrl.id, v);
          });
          break;

        case 'toggle':
          const checked = state[ctrl.id] ? 'checked' : '';
          group.innerHTML = `
            <div class="toggle-wrap">
              <span class="toggle-label">${ctrl.label}</span>
              <label class="toggle-switch">
                <input type="checkbox" data-ctrl="${ctrl.id}" ${checked}>
                <span class="toggle-slider"></span>
              </label>
            </div>`;
          const cb = group.querySelector('input[type=checkbox]');
          cb.addEventListener('change', () => onChange(ctrl.id, cb.checked));
          break;

        case 'color':
          const color = state[ctrl.id] || ctrl.default || '#6366f1';
          group.innerHTML = `
            <div class="control-label">${ctrl.label}</div>
            <input type="color" class="ctrl-color" data-ctrl="${ctrl.id}" value="${color}">`;
          const ci = group.querySelector('input[type=color]');
          ci.addEventListener('input', () => onChange(ctrl.id, ci.value));
          break;

        case 'number':
          const nval = state[ctrl.id] !== undefined ? state[ctrl.id] : ctrl.default;
          group.innerHTML = `
            <div class="control-label">${ctrl.label}</div>
            <input type="number" class="ctrl-number" data-ctrl="${ctrl.id}"
              min="${ctrl.min || ''}" max="${ctrl.max || ''}" step="${ctrl.step || 1}" value="${nval}">`;
          const ni = group.querySelector('input[type=number]');
          ni.addEventListener('change', () => onChange(ctrl.id, parseFloat(ni.value)));
          break;
      }

      container.appendChild(group);
    });
  }
};

/* ─────────────────────── PYTHON CODE GENERATOR ─────────────────────── */
MLViz.CodeGen = {
  generate(chartId, library, state, datasetName) {
    const chart = MLViz.chartRegistry[chartId];
    if (!chart || !chart.getCode) return '# Select a chart to see code';
    return chart.getCode(library, state, datasetName);
  },

  /**
   * Update the code panel with new code
   */
  updatePanel(code, library) {
    const codeEl = document.getElementById('python-code');
    const badgeEl = document.getElementById('code-lib-badge');
    if (codeEl) {
      codeEl.textContent = code;
      Prism.highlightElement(codeEl);
    }
    if (badgeEl) {
      badgeEl.textContent = library;
      badgeEl.className = 'code-lib-badge' + (library === 'seaborn' ? ' seaborn' : '');
    }
  }
};

/* ─────────────────────── THEME MANAGER ─────────────────────── */
MLViz.ThemeManager = {
  current: 'dark',

  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.current);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = this.current === 'dark' ? '\u25d0' : '\u25d1';
    // Re-render chart to update Plotly colors
    if (window.app && window.app.renderChart) window.app.renderChart();
  },

  getPlotlyLayout() {
    const isDark = this.current === 'dark';
    return {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'Inter, sans-serif',
        color: isDark ? '#9b9a97' : '#5e5d5a',
        size: 12
      },
      xaxis: {
        gridcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        zerolinecolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        linecolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
      },
      yaxis: {
        gridcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        zerolinecolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        linecolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
      },
      margin: { t: 40, r: 20, b: 50, l: 60 },
      showlegend: true,
      legend: {
        bgcolor: 'rgba(0,0,0,0)',
        font: { color: isDark ? '#9b9a97' : '#5e5d5a', size: 11 }
      },
      hoverlabel: {
        bgcolor: isDark ? '#1f2125' : '#ffffff',
        bordercolor: isDark ? '#2a2d33' : '#d6d4cf',
        font: { family: 'Inter, sans-serif', color: isDark ? '#e8e6e3' : '#1c1c1a', size: 12 }
      }
    };
  }
};

/* ─────────────────────── EXPLAINER ─────────────────────── */
MLViz.Explainer = {
  isActive: false,

  toggle() {
    this.isActive = !this.isActive;
    const btn = document.getElementById('explain-btn');
    const panel = document.getElementById('explain-content');
    if (btn) btn.classList.toggle('active', this.isActive);
    if (panel) {
      panel.classList.toggle('hidden', !this.isActive);
      if (this.isActive) this.show();
    }
  },

  show() {
    if (!window.app) return;
    const chart = MLViz.chartRegistry[window.app.state.chartId];
    if (!chart || !chart.getExplanation) return;
    const items = chart.getExplanation(window.app.state);
    const panel = document.getElementById('explain-content');
    if (!panel) return;
    panel.innerHTML = items.map(item =>
      `<div class="explain-item">
        <span class="explain-label">${item.icon || '📌'}</span>
        <span>${item.text}</span>
      </div>`
    ).join('');
  }
};

/* ─────────────────────── TOAST NOTIFICATIONS ─────────────────────── */
MLViz.toast = function(msg, duration = 2000) {
  const el = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!el || !msgEl) return;
  msgEl.textContent = msg;
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, duration);
};
