# Frontend for Retail Price Analyzer (RPA) Project 

RPA is an advanced scalable tool used by Czech Competition Authority for price analysis and detection of anticompetitive behavior. This frontend provides a comprehensive web interface for managing data harvesting, product analysis, and competition monitoring.

## Features

- 🔐 **User Authentication** - Secure login/logout with registration
- 🛒 **Product Management** - Browse and manage product catalogs with enhanced grid views
- 📦 **Basket Management** - Create and manage product baskets for analysis
- 📊 **Analysis Engine** - Create, configure and execute price analyses with workflow support
- 📈 **Results Visualization** - View and export analysis results
- 🕷️ **Data Harvesting** - Complete data collection infrastructure
  - Harvester management with real-time status monitoring
  - Data source configuration with URL management
  - Automated harvest scheduling with cron expressions
- 🌍 **Multi-language Support** - Czech, Slovak, English
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Technologies

- **React 18** - Modern UI framework with hooks and functional components
- **Vite** - Fast build tool and development server
- **AG-Grid Community** - Professional data grids with sorting, filtering, and editing
- **React JSON Schema Form (RJSF)** - Dynamic forms from JSON schemas
- **Context API** - State management for authentication and language
- **ES6+ JavaScript** - Modern JavaScript features
- **CSS3** - Responsive styling and animations

## Quick Start

### Prerequisites
- Node.js (18+)
- npm or yarn

### Installation and Running

```bash
# Clone repository
git clone https://github.com/zbysekmartoch/rpa-frontend.git
cd rpa-frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Configuration

Configuration is done in `vite.config.js`:

#### Development Server Configuration
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Required for external access (0.0.0.0)
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

**Key settings:**
- `host: true` - Binds server to `0.0.0.0`, making it accessible from external network
- `port: 5173` - Default Vite dev server port
- `proxy: /api` - Proxies API requests to backend server

#### Environment Variables

Create `.env` file for environment-specific configuration:
```bash
# Backend API URL (used in production build)
VITE_API_BASE_URL=http://localhost:3000

# Other environment variables as needed
```

**Note:** In development, API calls are proxied through Vite dev server. In production, `VITE_API_BASE_URL` is used.

### Running with PM2

For production deployment with PM2 process manager:

#### Installation
```bash
npm install -g pm2
```

#### Create PM2 ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'rpa-frontend',
    script: 'npm',
    args: 'run dev',
    cwd: '/path/to/rpa-frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5173
    }
  }]
}
```

#### PM2 Commands
```bash
# Start application
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs rpa-frontend

# Restart application
pm2 restart rpa-frontend

# Stop application
pm2 stop rpa-frontend

# Auto-start on system boot
pm2 startup
pm2 save
```

#### Alternative: Direct PM2 Start
```bash
# Start dev server with PM2
pm2 start npm --name "rpa-frontend" -- run dev

# Start production build with serve
npm run build
pm2 serve dist 5173 --name "rpa-frontend" --spa
```

**Production considerations:**
- Use `npm run build` to create optimized production bundle
- Serve `dist/` folder with PM2 or nginx
- Set `VITE_API_BASE_URL` to production backend URL
- Enable HTTPS for production deployment

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthPage.jsx    # Authentication page container
│   ├── CategoryTree.jsx # Hierarchical category browser
│   ├── LanguageSelector.jsx # Language switching
│   ├── LoginForm.jsx   # Login form component
│   ├── ProductGrid.jsx # Enhanced product grid with price/seller counts
│   ├── ProductTable.jsx # Product table display
│   ├── RegisterForm.jsx # User registration
│   ├── ResetPasswordForm.jsx # Password reset
│   ├── TopBar.jsx      # Main navigation bar
│   └── WorkflowSelector.jsx # Analysis workflow selector
├── context/            # React context providers
│   ├── AuthContext.jsx # Authentication state management
│   └── LanguageContext.jsx # Language settings
├── tabs/               # Main application pages/tabs
│   ├── ProductsTab.jsx     # Product catalog management
│   ├── BasketsTab.jsx      # Shopping basket management
│   ├── AnalysesTab.jsx     # Analysis configuration
│   ├── ResultsTab.jsx      # Analysis results viewer
│   ├── SettingsTab.jsx     # Application settings
│   ├── HarvestTab.jsx      # Data harvesting main tab
│   ├── HarvestersTab.jsx   # Harvester management with status monitoring
│   ├── DataSourcesTab.jsx  # Data source configuration
│   └── HarvestScheduleTab.jsx # Automated harvest scheduling
├── schemas/            # JSON schemas for dynamic forms
│   ├── analysisSettings.js
│   ├── analysisSettings.schema.json
│   └── analysisSettings.uiSchema.js
├── hooks/              # Custom React hooks
│   └── useCategoryTree.js
├── i18n/              # Internationalization
│   └── translations.js
├── lib/               # Utility functions
│   ├── fetchJSON.js   # API communication utility
│   └── inferSchema.js # Schema inference tools
└── main.jsx           # Application entry point
```

## Localization

The application supports three languages:
- 🇨🇿 Czech (default)
- 🇸🇰 Slovak
- 🇬🇧 English

Language is automatically detected from browser settings, but can be changed in Settings.

## Data Harvesting System

The application includes a comprehensive data harvesting infrastructure:

### Harvesters
- **Real-time Status Monitoring** - Automatic status checks every minute
- **Network Performance Tracking** - Upload/download speeds, ping monitoring
- **Visual Status Indicators** - Color-coded status in Host column (green=online, red=offline)
- **CRUD Operations** - Create, view, and delete harvesters
- **Manual Status Refresh** - On-demand status updates

### Data Sources
- **URL Management** - Support for multiple URLs per data source
- **Comment Support** - Lines starting with `#` treated as comments
- **Flexible Configuration** - Simple name + URLs structure
- **Clickable Links** - Direct access to configured URLs

### Harvest Scheduling
- **Cron Expression Support** - Full cron syntax for flexible scheduling
- **Visual Cron Helper** - Format hints and examples in UI
- **Human-readable Interpretation** - Automatic translation of cron expressions to plain English
- **Harvester/Data Source Linking** - Dropdown selection with names
- **Schedule Management** - Complete CRUD operations for harvest schedules

## Backend API Integration

Frontend communicates with REST API backend. Key endpoints:

### Authentication
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/register` - User registration

### Product Management
- `GET /api/v1/products` - Product catalog with enhanced metadata
- `GET /api/v1/baskets` - Basket management
- `GET /api/v1/categories` - Product categories

### Analysis System
- `POST /api/v1/analyses` - Create new analysis
- `GET /api/v1/analyses` - List analyses
- `GET /api/v1/results` - Analysis results
- `GET /api/v1/workflows` - Available analysis workflows

### Data Harvesting
- `GET /api/v1/harvesters` - Harvester list
- `GET /api/v1/harvesters/{id}/status` - Real-time harvester status
- `POST/PUT/DELETE /api/v1/harvesters` - Harvester management
- `GET /api/v1/data-sources` - Data source configuration
- `POST/PUT/DELETE /api/v1/data-sources` - Data source management
- `GET /api/v1/harvest-schedule` - Scheduled harvests
- `POST/PUT/DELETE /api/v1/harvest-schedule` - Schedule management

## Development

### Adding New Components

1. Create component in appropriate `src/components/` subdirectory
2. Follow React functional component patterns with hooks
3. Use AG-Grid for data tables when appropriate
4. Implement proper error handling and loading states

### Adding New Tabs

1. Create component in `src/tabs/`
2. Add tab to main navigation in `App.jsx`
3. Add translation keys to `src/i18n/translations.js`
4. Update routing if needed

### Working with Data Harvesting

1. **Harvesters** - Use `HarvestersTab.jsx` as reference for status monitoring
2. **Data Sources** - Follow URL array patterns in `DataSourcesTab.jsx`
3. **Scheduling** - Implement cron patterns using `HarvestScheduleTab.jsx` utilities

### Adding New Language

1. Add translations to `src/i18n/translations.js`
2. Update `LanguageSelector.jsx` component
3. Add language detection to `LanguageContext.jsx`
4. Test all UI elements in new language

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Linting
```

## Third-party Components

- **AG-Grid Community** - Professional data tables with sorting, filtering, row selection
- **React JSON Schema Form (RJSF)** - Dynamic form generation from JSON schemas
- **React Context API** - Built-in state management for global app state

## Key Features Implementation

### Real-time Status Monitoring
- Automatic harvester status checks using `setInterval`
- Visual feedback with color-coded cells in AG-Grid
- Manual refresh capabilities for immediate updates

### Cron Expression Management
- `interpretCronExpression()` function for human-readable translations
- Visual hints with format examples in tooltips
- Support for standard 5-field cron syntax

### Enhanced Product Grids
- Price count and seller count display
- Category-based filtering and navigation
- Responsive grid layouts with AG-Grid

### Workflow Integration
- Dynamic workflow loading from backend
- JSON Schema-based analysis configuration
- Seamless workflow selection in analysis forms

## License

MIT License

## Author

Zbyšek Martoch - [GitHub](https://github.com/zbysekmartoch)
