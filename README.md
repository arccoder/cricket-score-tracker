# Cricket Score Tracker

A modern, feature-rich web application for tracking cricket match scores in real-time. Built with React and Vite, featuring dark mode, undo/redo support, and CSV export capabilities.

## 🎯 Overview

Cricket Score Tracker is an advanced scoring application designed for cricket enthusiasts and match organizers. It provides an intuitive interface to track runs, wickets, extras, and deliveries for multi-innings cricket matches. The application supports custom configurations for overs and players, complete match history with undo/redo functionality, and data export capabilities.

## ✨ Key Features

- **Real-time Score Tracking**: Track runs, wickets, extras, and deliveries for both innings
- **Undo/Redo Support**: Full history management for match states with complete rollback capability
- **Custom Scoring**: Input custom runs for rare and special scenarios
- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **CSV Export**: Export complete match logs for record-keeping and analysis
- **Multi-Innings Support**: Manage complete two-innings cricket matches
- **Configurable Setup**: Set custom number of overs and players before match starts
- **Team Management**: Name and track individual teams
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **React 18**: Modern UI framework with hooks
- **Vite**: Lightning-fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Beautiful and consistent icon library
- **gh-pages**: Deployment tool for GitHub Pages

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/arccoder/cricket-score-tracker.git
   cd cricket-score-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Development

Run the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Build

Preview the production build locally:

```bash
npm run preview
```

## 📦 Deployment to GitHub Pages

This project is configured for deployment on GitHub Pages. Follow these steps to deploy:

### Initial Setup (One-time)

1. Ensure your repository is public on GitHub
2. The `vite.config.js` already has the base path configured correctly:
   ```javascript
   base: '/cricket-score-tracker/',
   ```
3. Install dependencies if not already done:
   ```bash
   npm install
   ```

### Deploy

Deploy to GitHub Pages with a single command:

```bash
npm run deploy
```

This command will:

1. Build the project (`npm run build`)
2. Deploy the `dist/` folder to the `gh-pages` branch
3. Make your site live at `https://yourusername.github.io/cricket-score-tracker`

### Enable GitHub Pages (if not already enabled)

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select the `gh-pages` branch
5. Click Save

Your site should now be live!

### Automatic Deployment with GitHub Actions (Optional)

For automatic deployment on every push, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 📖 How to Use

1. **Setup Match**:
   - Enter the number of overs
   - Enter the number of players per team
   - Set team names
   - Click "Start Match"

2. **Track Scoring**:
   - Use the buttons to record different ball outcomes
   - Select runs (0-6) using the run selector
   - Record extras (wides, no-balls, etc.)
   - Mark wickets when they occur

3. **Custom Runs**:
   - Click the "+" button to enter custom run values
   - Useful for special scenarios or corrections

4. **Review History**:
   - View complete match history in the History tab
   - Use Undo to revert recent actions

5. **Export Data**:
   - Click the Download button to export match log as CSV
   - Perfect for record-keeping and analysis

6. **Switch Innings**:
   - Automatically move to the second innings after the first team's allotted overs

## 🎨 Customization

The app uses Tailwind CSS for styling. Modify `tailwind.config.js` to customize colors and design.

## 📋 Available Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start development server         |
| `npm run build`   | Build for production             |
| `npm run preview` | Preview production build         |
| `npm run deploy`  | Build and deploy to GitHub Pages |
| `npm run lint`    | Run ESLint                       |

## 🔧 Project Structure

```
src/
├── App.jsx          # Main application component
├── App.css          # Application styles
├── main.jsx         # React entry point
└── index.css        # Global styles
```

## 📝 License

This project is open source. Feel free to use and modify it for your needs.

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests.

## 🐛 Troubleshooting

**Q: The app doesn't load on GitHub Pages**

- A: Ensure the `base` property in `vite.config.js` matches your repository name

**Q: Changes aren't showing after deployment**

- A: Clear your browser cache or do a hard refresh (Ctrl+F5 or Cmd+Shift+R)

**Q: Deployment fails**

- A: Ensure the `gh-pages` branch exists and GitHub Pages is enabled for that branch in Settings
