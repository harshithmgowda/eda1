/* ═══════════════════════════════════════════════════════════════════════════
   ML VISUALIZATION PLAYGROUND — WORKFLOW MODULE
   Guided ML workflow with 10 steps and recommended visualizations
   ═══════════════════════════════════════════════════════════════════════════ */

window.MLViz = window.MLViz || {};

MLViz.Workflow = {
  steps: [
    { num: '1', title: 'Load Data', desc: 'Import and inspect your dataset', charts: ['bar', 'count'] },
    { num: '2', title: 'Understand Data', desc: 'Get familiar with features and types', charts: ['bar', 'count', 'histogram'] },
    { num: '3', title: 'Check Missing Values', desc: 'Identify and handle missing data', charts: ['missing_values'] },
    { num: '4', title: 'Check Distributions', desc: 'Understand feature distributions', charts: ['histogram', 'kde', 'box', 'violin'] },
    { num: '5', title: 'Detect Outliers', desc: 'Find and handle unusual values', charts: ['box', 'outlier_lab'] },
    { num: '6', title: 'Check Relationships', desc: 'Explore feature correlations', charts: ['scatter', 'regplot', 'pairplot', 'jointplot'] },
    { num: '7', title: 'Check Correlation', desc: 'Quantify linear relationships', charts: ['heatmap'] },
    { num: '8', title: 'Analyze Target', desc: 'Understand your target variable', charts: ['histogram', 'count', 'bar'] },
    { num: '9', title: 'Train Model', desc: 'Train and monitor the model', charts: ['loss_curve', 'learning_curve', 'lr_viz'] },
    { num: '10', title: 'Evaluate Model', desc: 'Assess model performance', charts: ['confusion', 'roc', 'pr_curve', 'actual_vs_pred', 'residual', 'feature_imp', 'model_perf'] }
  ],

  render() {
    const body = document.getElementById('workflow-body');
    if (!body) return;
    body.innerHTML = this.steps.map((step, i) => `
      <div class="workflow-step" data-step="${i}">
        <div class="workflow-step-num">${step.num}</div>
        <div class="workflow-step-content">
          <h4>${step.title}</h4>
          <p>${step.desc}</p>
          <div class="workflow-step-charts">
            ${step.charts.map(c => {
              const chart = MLViz.chartRegistry[c];
              return `<button class="workflow-chart-tag" data-chart="${c}">${chart ? chart.name : c}</button>`;
            }).join('')}
          </div>
        </div>
      </div>
    `).join('');

    // Bind click events
    body.querySelectorAll('.workflow-chart-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chartId = btn.dataset.chart;
        if (window.app) {
          window.app.selectChart(chartId);
          document.getElementById('workflow-modal').classList.add('hidden');
        }
      });
    });
  }
};
