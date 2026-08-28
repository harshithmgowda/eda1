# ML Visualization Playground (Matplotlib & Seaborn)

An interactive, visual playground for learning Python, Data Science, and Machine Learning visualizations with **Matplotlib** and **Seaborn**.

Live link / Deployable to **Vercel** with zero-config.

---

## Features

- **34+ Chart Types Across 9 Categories**:
  - **Basic / Essential**: Line Plot, Scatter Plot, Bar Plot, Horizontal Bar, Histogram, Box Plot, Violin Plot, KDE Plot
  - **Categorical**: Count Plot, Strip Plot, Swarm Plot, Point Plot, Catplot Lab
  - **Relationship**: Regression Plot, LM Plot
  - **Correlation**: Heatmap, Pairplot, Joint Plot, Hexbin Plot
  - **ML Models**: Confusion Matrix, Feature Importance, Model Comparison, ROC Curve, Precision-Recall, Learning Curve, Validation Curve
  - **Training**: Loss Curve, Learning Rate Visualizer
  - **Data Cleaning**: Missing Values, Distribution Compare, Standardization, Outlier Lab
  - **Multi-Plot**: Subplots, Multiple Axes
  - **Regression Diagnostics**: Actual vs Predicted, Residual Plot, Residual Distribution

- **Interactive Controls Panel**:
  - Real-time parameter tweaking (Colors, Alpha, Point Sizes, Line Widths, Bins, Noise, Smoothness, Thresholds, Polynomial Degrees).
  - Dynamic dataset switching (Student, Employee, House Prices, Iris, Titanic, Wine, Heart Disease, Diabetes, Breast Cancer, Tips, Stocks, Synthetic).

- **Live Code Generation**:
  - Automatically generates copy-ready, production-grade Python code for both **Matplotlib** and **Seaborn** as you interact with controls.

- **10-Step ML EDA Workflow Guide**:
  - Step-by-step guidance from data loading and cleaning to model evaluation and residual analysis.

- **Visualization Arcade**:
  - 6 interactive mini-games to test and reinforce data science intuition (Pick the Chart, Find Correlation, Distribution Detective, Overfitting Detective, Confusion Matrix, Find the Outlier).

- **Modern, Distraction-Free UI**:
  - Responsive design with dark/light mode toggle.
  - No bloated frameworks — fast, lightweight client-side execution via Plotly and Prism.js.

---

## Getting Started Locally

Open `index.html` directly in any modern browser, or run a local static server:

```bash
# Using npx serve
npx serve .

# Or using Python
python -m http.server 3000
```

---

## Deployment to Vercel

This repository is ready to deploy directly on Vercel:

1. Import this repository into [Vercel](https://vercel.com).
2. Framework Preset: **Other** / Static Site (Root directory `./`).
3. Click **Deploy**.
