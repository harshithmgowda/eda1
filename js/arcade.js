/* ═══════════════════════════════════════════════════════════════════════════
   ML VISUALIZATION PLAYGROUND — ARCADE MODULE
   6 mini-games for learning visualization concepts
   ═══════════════════════════════════════════════════════════════════════════ */

window.MLViz = window.MLViz || {};
const HG = () => MLViz.helpers;

MLViz.Arcade = {
  currentGame: null,
  score: 0,
  total: 0,

  games: {
    pick_chart: {
      name: 'Pick the Chart',
      desc: 'Which chart should you use for this scenario?',
      questions: [
        { q: 'You want to see the distribution of Ages in your dataset.', a: 'Histogram', options: ['Histogram', 'Scatter Plot', 'Heatmap', 'Bar Plot'] },
        { q: 'You want to check for outliers in Salary data.', a: 'Box Plot', options: ['Line Plot', 'Box Plot', 'Pie Chart', 'Count Plot'] },
        { q: 'You want to see the correlation between ALL features.', a: 'Heatmap', options: ['Scatter Plot', 'Bar Plot', 'Heatmap', 'Line Plot'] },
        { q: 'You want to see how two features relate to each other.', a: 'Scatter Plot', options: ['Scatter Plot', 'Histogram', 'Count Plot', 'Box Plot'] },
        { q: 'You want to check if classes are balanced.', a: 'Count Plot', options: ['Scatter Plot', 'Count Plot', 'Violin Plot', 'KDE Plot'] },
        { q: 'You want to evaluate a classifier\'s predictions.', a: 'Confusion Matrix', options: ['Heatmap', 'Confusion Matrix', 'Histogram', 'Box Plot'] },
        { q: 'You want to monitor training progress over epochs.', a: 'Loss Curve', options: ['Scatter Plot', 'Loss Curve', 'Bar Plot', 'Pairplot'] },
        { q: 'You want to find the best classification threshold.', a: 'ROC Curve', options: ['ROC Curve', 'Box Plot', 'Histogram', 'Bar Plot'] },
      ]
    },
    find_correlation: {
      name: 'Find the Correlation',
      desc: 'Identify positive, negative, or no correlation.'
    },
    distribution_detective: {
      name: 'Distribution Detective',
      desc: 'Identify the distribution shape: Normal, Left Skew, Right Skew, or Bimodal.'
    },
    overfitting_detective: {
      name: 'Overfitting Detective',
      desc: 'Analyze learning curves — is the model underfitting, overfitting, or just right?'
    },
    confusion_detective: {
      name: 'Confusion Matrix',
      desc: 'Click the correct cell: TP, TN, FP, or FN.'
    },
    find_outlier: {
      name: 'Find the Outlier',
      desc: 'Click the unusual data point!'
    }
  },

  renderMenu() {
    const body = document.getElementById('arcade-body');
    if (!body) return;
    body.innerHTML = `
      <div class="arcade-grid">
        ${Object.entries(this.games).map(([id, game]) => `
          <div class="arcade-card" data-game="${id}">
            <h4>${game.name}</h4>
            <p>${game.desc}</p>
          </div>
        `).join('')}
      </div>
    `;

    body.querySelectorAll('.arcade-card').forEach(card => {
      card.addEventListener('click', () => this.startGame(card.dataset.game));
    });
  },

  startGame(gameId) {
    this.currentGame = gameId;
    this.score = 0;
    this.total = 0;
    this.currentQ = 0;

    const body = document.getElementById('arcade-body');
    if (!body) return;

    if (gameId === 'pick_chart') {
      this.renderPickChart(body);
    } else if (gameId === 'find_correlation') {
      this.renderCorrelation(body);
    } else if (gameId === 'distribution_detective') {
      this.renderDistribution(body);
    } else if (gameId === 'overfitting_detective') {
      this.renderOverfitting(body);
    } else if (gameId === 'confusion_detective') {
      this.renderConfusionGame(body);
    } else if (gameId === 'find_outlier') {
      this.renderOutlier(body);
    }
  },

  renderPickChart(body) {
    const game = this.games.pick_chart;
    const questions = HG().shuffle(game.questions).slice(0, 5);
    this.quizQuestions = questions;
    this.showQuizQuestion(body, 0);
  },

  showQuizQuestion(body, idx) {
    if (idx >= this.quizQuestions.length) {
      body.innerHTML = `
        <div class="arcade-game">
          <h3>Game Over!</h3>
          <p class="arcade-score">Score: ${this.score} / ${this.quizQuestions.length}</p>
          <p style="margin-top:16px;color:var(--text-secondary)">${this.score === this.quizQuestions.length ? 'Perfect score!' : this.score >= 3 ? 'Good job!' : 'Keep practicing!'}</p>
          <button class="arcade-next-btn" onclick="MLViz.Arcade.renderMenu()" style="margin-top:24px">← Back to Arcade</button>
        </div>
      `;
      return;
    }
    const q = this.quizQuestions[idx];
    const options = HG().shuffle(q.options);
    body.innerHTML = `
      <div class="arcade-game">
        <h3>Pick the Chart (${idx + 1}/${this.quizQuestions.length})</h3>
        <p class="arcade-question">${q.q}</p>
        <div class="arcade-options">
          ${options.map(o => `<button class="arcade-option" data-answer="${o}">${o}</button>`).join('')}
        </div>
        <p class="arcade-score">Score: ${this.score}</p>
      </div>
    `;
    body.querySelectorAll('.arcade-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.answer === q.a;
        if (isCorrect) this.score++;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          body.querySelector(`[data-answer="${q.a}"]`).classList.add('correct');
        }
        setTimeout(() => this.showQuizQuestion(body, idx + 1), 1200);
      }, { once: true });
    });
  },

  renderCorrelation(body) {
    const scenarios = [
      { r: 0.85, answer: 'Strong Positive' },
      { r: -0.75, answer: 'Strong Negative' },
      { r: 0.1, answer: 'No Correlation' },
      { r: -0.9, answer: 'Strong Negative' },
      { r: 0.5, answer: 'Moderate Positive' },
    ];
    const s = HG().pick(scenarios);
    const n = 60;
    const x = Array.from({ length: n }, () => HG().randnorm(5, 2));
    const y = x.map(v => v * s.r + HG().randnorm(0, Math.sqrt(1 - s.r * s.r) * 2));

    body.innerHTML = `
      <div class="arcade-game">
        <h3>What type of correlation is this?</h3>
        <div class="arcade-chart-container" id="arcade-chart"></div>
        <div class="arcade-options">
          <button class="arcade-option" data-answer="Strong Positive">Strong Positive</button>
          <button class="arcade-option" data-answer="Moderate Positive">Moderate Positive</button>
          <button class="arcade-option" data-answer="No Correlation">No Correlation</button>
          <button class="arcade-option" data-answer="Strong Negative">Strong Negative</button>
        </div>
        <button class="arcade-next-btn" onclick="MLViz.Arcade.renderCorrelation(document.getElementById('arcade-body'))" style="margin-top:16px">Next →</button>
      </div>
    `;

    setTimeout(() => {
      Plotly.newPlot('arcade-chart', [{ x, y, mode: 'markers', marker: { size: 8, color: '#2cbca5', opacity: 0.7 } }], {
        ...MLViz.ThemeManager.getPlotlyLayout(), showlegend: false, margin: { t: 10, r: 10, b: 30, l: 30 }, height: 250
      }, { responsive: true, staticPlot: true });
    }, 50);

    body.querySelectorAll('.arcade-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.answer === s.answer;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) body.querySelector(`[data-answer="${s.answer}"]`)?.classList.add('correct');
        MLViz.toast(isCorrect ? 'Correct!' : `Wrong. It was: ${s.answer} (r ≈ ${HG().round(s.r, 2)})`, 2000);
      }, { once: true });
    });
  },

  renderDistribution(body) {
    const types = [
      { name: 'Normal', gen: () => Array.from({ length: 200 }, () => HG().randnorm(50, 10)) },
      { name: 'Right Skew', gen: () => Array.from({ length: 200 }, () => Math.abs(HG().randnorm(0, 10)) + 10) },
      { name: 'Left Skew', gen: () => Array.from({ length: 200 }, () => 100 - Math.abs(HG().randnorm(0, 10))) },
      { name: 'Bimodal', gen: () => [...Array.from({ length: 100 }, () => HG().randnorm(30, 5)), ...Array.from({ length: 100 }, () => HG().randnorm(70, 5))] },
    ];
    const chosen = HG().pick(types);
    const data = chosen.gen();

    body.innerHTML = `
      <div class="arcade-game">
        <h3>What distribution is this?</h3>
        <div class="arcade-chart-container" id="arcade-chart"></div>
        <div class="arcade-options">
          ${types.map(t => `<button class="arcade-option" data-answer="${t.name}">${t.name}</button>`).join('')}
        </div>
        <button class="arcade-next-btn" onclick="MLViz.Arcade.renderDistribution(document.getElementById('arcade-body'))" style="margin-top:16px">Next →</button>
      </div>
    `;

    setTimeout(() => {
      Plotly.newPlot('arcade-chart', [{ x: data, type: 'histogram', marker: { color: '#3dd4bc88' }, nbinsx: 25 }], {
        ...MLViz.ThemeManager.getPlotlyLayout(), showlegend: false, margin: { t: 10, r: 10, b: 30, l: 30 }, height: 250
      }, { responsive: true, staticPlot: true });
    }, 50);

    body.querySelectorAll('.arcade-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.answer === chosen.name;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) body.querySelector(`[data-answer="${chosen.name}"]`)?.classList.add('correct');
        MLViz.toast(isCorrect ? 'Correct!' : `Wrong. It was: ${chosen.name}`, 2000);
      }, { once: true });
    });
  },

  renderOverfitting(body) {
    const scenarios = [
      { name: 'Underfitting', trainHigh: false, gap: false },
      { name: 'Good Fit', trainHigh: true, gap: false },
      { name: 'Overfitting', trainHigh: true, gap: true },
    ];
    const chosen = HG().pick(scenarios);
    const epochs = HG().linspace(1, 50, 30);
    let train, val;
    if (chosen.name === 'Underfitting') {
      train = epochs.map(e => 0.55 + Math.log(e) * 0.03 + HG().randnorm(0, 0.01));
      val = epochs.map(e => 0.5 + Math.log(e) * 0.02 + HG().randnorm(0, 0.01));
    } else if (chosen.name === 'Overfitting') {
      train = epochs.map(() => 0.97 + HG().randnorm(0, 0.005));
      val = epochs.map(e => 0.6 + Math.log(e) * 0.03 + HG().randnorm(0, 0.01));
    } else {
      train = epochs.map(e => 0.95 - 0.15 * Math.exp(-e / 15) + HG().randnorm(0, 0.01));
      val = epochs.map(e => 0.7 + 0.15 * (1 - Math.exp(-e / 15)) + HG().randnorm(0, 0.01));
    }

    body.innerHTML = `
      <div class="arcade-game">
        <h3>Is this model underfitting, overfitting, or a good fit?</h3>
        <div class="arcade-chart-container" id="arcade-chart"></div>
        <div class="arcade-options" style="grid-template-columns:1fr 1fr 1fr">
          ${scenarios.map(s => `<button class="arcade-option" data-answer="${s.name}">${s.name}</button>`).join('')}
        </div>
        <button class="arcade-next-btn" onclick="MLViz.Arcade.renderOverfitting(document.getElementById('arcade-body'))" style="margin-top:16px">Next →</button>
      </div>
    `;

    setTimeout(() => {
      Plotly.newPlot('arcade-chart', [
        { x: epochs, y: train, mode: 'lines', name: 'Training', line: { color: '#2cbca5', width: 2.5 } },
        { x: epochs, y: val, mode: 'lines', name: 'Validation', line: { color: '#ef4444', width: 2.5 } }
      ], {
        ...MLViz.ThemeManager.getPlotlyLayout(), showlegend: true, margin: { t: 10, r: 10, b: 30, l: 40 }, height: 250,
        yaxis: { ...MLViz.ThemeManager.getPlotlyLayout().yaxis, title: 'Score', range: [0.3, 1.05] },
        xaxis: { ...MLViz.ThemeManager.getPlotlyLayout().xaxis, title: 'Epoch' }
      }, { responsive: true, staticPlot: true });
    }, 50);

    body.querySelectorAll('.arcade-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.answer === chosen.name;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) body.querySelector(`[data-answer="${chosen.name}"]`)?.classList.add('correct');
        MLViz.toast(isCorrect ? 'Correct!' : `Wrong. It was: ${chosen.name}`, 2000);
      }, { once: true });
    });
  },

  renderConfusionGame(body) {
    const cells = [
      { label: 'TP', desc: 'Model correctly predicted POSITIVE', pos: 'bottom-right' },
      { label: 'TN', desc: 'Model correctly predicted NEGATIVE', pos: 'top-left' },
      { label: 'FP', desc: 'Model predicted POSITIVE but was WRONG', pos: 'top-right' },
      { label: 'FN', desc: 'Model predicted NEGATIVE but was WRONG', pos: 'bottom-left' },
    ];
    const target = HG().pick(cells);

    body.innerHTML = `
      <div class="arcade-game">
        <h3>Click the cell: "${target.desc}"</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:300px;margin:24px auto;">
          <div style="text-align:center;grid-column:span 2;color:var(--text-muted);font-size:0.8rem;">Predicted →</div>
          <button class="arcade-option" data-answer="TN" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700">TN</button>
          <button class="arcade-option" data-answer="FP" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700">FP</button>
          <button class="arcade-option" data-answer="FN" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700">FN</button>
          <button class="arcade-option" data-answer="TP" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700">TP</button>
        </div>
        <button class="arcade-next-btn" onclick="MLViz.Arcade.renderConfusionGame(document.getElementById('arcade-body'))" style="margin-top:16px">Next →</button>
      </div>
    `;

    body.querySelectorAll('.arcade-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.answer === target.label;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) body.querySelector(`[data-answer="${target.label}"]`)?.classList.add('correct');
        MLViz.toast(isCorrect ? 'Correct!' : `Wrong. It was: ${target.label}`, 2000);
      }, { once: true });
    });
  },

  renderOutlier(body) {
    const n = 30;
    const x = Array.from({ length: n }, () => HG().randnorm(5, 1.5));
    const y = x.map(v => 2 * v + 10 + HG().randnorm(0, 2));
    // Add outlier
    const ox = HG().randnorm(5, 1);
    const oy = HG().randnorm(35, 3);
    x.push(ox); y.push(oy);

    body.innerHTML = `
      <div class="arcade-game">
        <h3>Click the outlier!</h3>
        <div class="arcade-chart-container" id="arcade-chart"></div>
        <p style="color:var(--text-muted);margin-top:8px">Click on the point that doesn't belong</p>
        <button class="arcade-next-btn" onclick="MLViz.Arcade.renderOutlier(document.getElementById('arcade-body'))" style="margin-top:16px">Next →</button>
      </div>
    `;

    setTimeout(() => {
      const colors = Array(n).fill('#2cbca5');
      colors.push('#2cbca5');
      Plotly.newPlot('arcade-chart', [{
        x, y, mode: 'markers', marker: { size: 12, color: colors, opacity: 0.8 }
      }], {
        ...MLViz.ThemeManager.getPlotlyLayout(), showlegend: false, margin: { t: 10, r: 10, b: 30, l: 30 }, height: 280
      }, { responsive: true });

      document.getElementById('arcade-chart').on('plotly_click', (ed) => {
        const idx = ed.points[0].pointIndex;
        if (idx === n) {
          MLViz.toast('Correct! That point is the outlier!', 2500);
          Plotly.restyle('arcade-chart', { 'marker.color': [x.map((_, i) => i === n ? '#22c55e' : '#2cbca5')] });
        } else {
          MLViz.toast('Not quite — try the point that\'s far from the trend', 2000);
          Plotly.restyle('arcade-chart', { 'marker.color': [x.map((_, i) => i === idx ? '#ef4444' : '#2cbca5')] });
        }
      });
    }, 50);
  }
};
