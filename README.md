# RPA Frontend - Retail Price Analyzer

A comprehensive web application for price analysis and detection of anticompetitive behavior, developed for the Czech Competition Authority (ÚOHS).

## Features

### Core Functionality
- 🔐 **Authentication** - Secure JWT-based login with registration and password reset
- 🛒 **Product Catalog** - Browse products with advanced filtering, sorting, and category navigation
- 📦 **Basket Management** - Create and manage product baskets for analysis
- 📊 **Analysis Engine** - Configure and execute price analyses with workflow support
- 📈 **Results Viewer** - View, download, and manage analysis results

### Advanced Features (configurable)
- 🕷️ **Data Harvesting** - Complete data collection infrastructure
  - Harvester management with real-time status monitoring
  - Data source configuration with multi-URL support
  - Automated harvest scheduling with cron expressions
- 📝 **Script Editor** - Monaco-based code editor for analysis scripts
  - Syntax highlighting for Python, JavaScript, SQL, JSON
  - Theme selection (Light/Dark/High Contrast)
  - Open in new window functionality
  - Drag & drop file upload

### User Experience
- 🌍 **Multi-language Support** - Czech, Slovak, English
- 💾 **State Persistence** - Tab state preserved when switching between views
- 🎨 **Consistent Grid Styling** - Centralized AG Grid configuration with tooltips
- 📱 **Responsive Design** - Works on desktop and tablet devices

## Tech Stack

- **React 18** - UI framework with hooks and functional components
- **Vite** - Build tool and development server
- **AG Grid Community** - Data grids with sorting, filtering, and virtualization
- **Monaco Editor** - VS Code-based code editor for scripts
- **React JSON Schema Form** - Dynamic forms from JSON schemas
- **Context API** - State management for auth, language, and settings

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthPage.jsx         # Authentication forms container
│   ├── CategoryTree.jsx     # Hierarchical category browser
│   ├── ProductGrid.jsx      # Main product data grid with filters
│   ├── LanguageSelector.jsx # Language switching UI
│   └── WorkflowSelector.jsx # Analysis workflow picker
├── tabs/               # Main application tabs
│   ├── ProductsTab.jsx      # Product catalog browser
│   ├── BasketsTab.jsx       # Basket management
│   ├── AnalysesTab.jsx      # Analysis configuration (container)
│   ├── AnalysisDefinitionTab.jsx   # Monaco script editor
│   ├── AnalysisExecutionTab.jsx    # Analysis runner
│   ├── ResultsTab.jsx       # Results viewer
│   ├── HarvestTab.jsx       # Harvesting container
│   ├── HarvestersTab.jsx    # Harvester management
│   ├── DataSourcesTab.jsx   # Data source config
│   ├── HarvestScheduleTab.jsx # Scheduling
│   └── SettingsTab.jsx      # User settings
├── context/            # React context providers
│   ├── AuthContext.jsx      # Authentication state & JWT handling
│   ├── LanguageContext.jsx  # Internationalization
│   └── SettingsContext.jsx  # User preferences
├── lib/                # Utility functions
│   ├── fetchJSON.js         # API wrapper with auto JWT injection
│   └── gridConfig.js        # Centralized AG Grid configuration
├── i18n/               # Translations
│   └── translations.js      # Language strings (cs/sk/en)
├── schemas/            # JSON Schema definitions
│   └── analysisSettings.js  # Analysis form schema
├── App.jsx             # Main application component
└── main.jsx            # Application entry point
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd rpa-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

Development server configuration in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,     // Bind to 0.0.0.0 for external access
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### Build for Production

```bash
npm run build     # Creates optimized build in dist/
npm run preview   # Preview production build locally
```

## Key Design Decisions

### Tab State Preservation
All tabs are rendered simultaneously with CSS `display: none` for inactive tabs. This preserves:
- Selected categories and products
- Filter and sort settings
- Scroll positions
- Form data

### Centralized Grid Configuration
All AG Grid instances share configuration from `lib/gridConfig.js`:
- Consistent row height (24px), header height (36px)
- Unified color scheme with row striping and hover effects
- Shared filter configurations (text/number/date)
- Tooltip settings for truncated content

### Authentication
JWT tokens stored in localStorage with automatic injection via `fetchJSON()` wrapper. All API calls include Authorization header.

### Monaco Editor Integration
Script editor features:
- Syntax highlighting based on file extension
- Theme persistence in localStorage
- Open in new window with full editing capabilities
- Drag & drop file upload to folders

## Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide and coding standards
- [API.md](API.md) - Backend API documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- [HARVEST_SYSTEM.md](HARVEST_SYSTEM.md) - Data harvesting system docs
- [CHANGELOG.md](CHANGELOG.md) - Version history

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

Proprietary - Czech Competition Authority (ÚOHS)
