# Changelog

All notable changes to the RPA Frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-01-19

### Added

#### Toast Notification System
- **Toast.jsx** - Non-modal notification component replacing `alert()` calls
  - Auto-dismiss with configurable duration (default 4s)
  - Smooth fadeout animation
  - Types: success (green), error (red), warning (yellow), info (blue)
  - Click to dismiss functionality
  - `useToast()` hook for global access

#### Application Configuration
- **appConfig.js** - Centralized configuration values
  - `RESULT_LOG_POLL_INTERVAL_MS` - Polling interval for live logs (5s)
  - `TOAST_DURATION_MS` - Toast notification duration (4s)

#### FileManagerEditor Component
- **FileManagerEditor.jsx** - Reusable file browser with Monaco editor
  - Used in AnalysisDefinitionTab and DebugTab
  - Collapsible folder tree with file counts
  - PDF preview with blob URL (works in Chrome/Firefox)
  - Image preview for common formats
  - Folder-specific upload buttons
  - Refresh button for file list
  - Drag & drop upload to specific folders
  - File size and modification date display

#### Debug Tab
- **DebugTab.jsx** - Analysis debugging interface
  - Result selector dropdown with auto-refresh on focus
  - Side-by-side view: result files | scripts
  - Resizable splitter between panels
  - Run in debug mode functionality
  - Live progress tracking for running analyses
  - Status polling for pending results

#### Live Analysis Progress
- Progress info bar in DebugTab and ResultsTab
  - Current step / total steps display
  - Current step name
  - Step elapsed time
  - Total analysis elapsed time
  - Visual progress bar (ResultsTab)

#### Live Log Streaming
- **ResultsTab** - Real-time log viewer
  - Auto-scrolling terminal-style display
  - Error keyword highlighting (red background)
  - Polling while analysis is running
  - Open log in new window button
  - Pulse animation for pending status

### Changed

#### UI Improvements
- **AnalysesTab** - Definition sub-tab hidden in simple UI mode
- **AnalysisExecutionTab** - Auto-save on form changes (debounced)
  - No submit button - saves automatically
  - Status indicator: saving / saved / error
  - Delete analysis button added
  - ID column hidden in simple UI mode
  - ID badge shown in detail panel
- **BasketsTab** - Toolbar reorganized
  - Action buttons on the left
  - Status and remove button on the right
  - ID column hidden in simple UI mode
- **ResultsTab** - Two-column layout
  - Left: status, downloads, progress info
  - Right: live log viewer
  - Refresh button added

#### Alert to Toast Migration
- All `alert()` calls replaced with toast notifications
- Affected tabs: ProductsTab, BasketsTab, AnalysisExecutionTab, DataSourcesTab, HarvestersTab, HarvestScheduleTab, ToolsTab, ResultsTab

#### Workflow Widget
- Updated translation keys for workflow selector
- Simplified UI schema without row configuration

### Fixed
- Baskets dropdown in ProductsTab now refreshes on focus
- PDF preview now works correctly in both Chrome and Firefox

## [2.1.0] - 2025-12-27

### Added

#### Centralized Grid Configuration
- **gridConfig.js** - Centralized AG Grid configuration for all grids
  - Unified row height, header height, and styling
  - Shared CSS theme variables for consistent appearance
  - Text, number, and date filter configurations
  - Tooltip support for truncated cell content

#### Client-side Filtering
- **ProductGrid.jsx** - Enhanced with floating filters
  - Text filters with contains, starts with, ends with options
  - Number filters with greater than, less than, equals, in range
  - Date filters for price date columns
  - Filter row displayed below header

#### Monaco Editor Enhancements
- **AnalysisDefinitionTab.jsx** - Script editor improvements
  - Theme selection (Light, Dark, High Contrast) with persistence
  - Open in new window functionality with full editing
  - Drag & drop file upload to folders
  - File modification timestamps display

#### Tab State Preservation
- **App.jsx** - Tabs now preserve state when switching
  - All tabs rendered simultaneously, hidden with CSS
  - Preserves selections, filters, sort order, scroll position

### Changed

#### Code Quality
- All comments translated to English
- Added JSDoc headers to all components
- Consistent coding patterns across files

#### Authentication
- Added Authorization header to all fetch calls
- Consistent JWT token handling via fetchJSON wrapper

### Documentation
- Updated README.md with current features
- Updated DEVELOPMENT.md with coding standards
- All documentation now in English

## [2.0.0] - 2025-10-05

### Added

#### Data Harvesting System
- **HarvestTab.jsx** - Main container for data harvesting functionality with 3 sub-tabs
- **HarvestersTab.jsx** - Harvester management with real-time status monitoring
  - Automatic status checks every 60 seconds using `setInterval`
  - Visual status indicators (green=online, red=offline) in Host column
  - Network performance monitoring (upload/download speeds, ping)
  - Manual status refresh functionality
  - CRUD operations for harvester management
- **DataSourcesTab.jsx** - Data source configuration and management
  - Support for multiple URLs per data source
  - Comment support (lines starting with `#`)
  - URL array/string format compatibility
  - Clickable URL links in detail view
- **HarvestScheduleTab.jsx** - Automated harvest scheduling
  - Full cron expression support with 5-field syntax
  - Human-readable cron interpretation with `interpretCronExpression()` function
  - Visual cron helpers with tooltips and examples
  - Dropdown selection for harvesters and data sources
  - Complete CRUD operations for schedule management

#### Enhanced Components
- **ProductGrid.jsx** - Enhanced with `priceCount` and `sellerCount` columns
- **WorkflowSelector.jsx** - Custom RJSF widget for loading analysis workflows from backend

#### API Integration
- **Harvester Status API** - Real-time status monitoring via `/api/v1/harvesters/{id}/status`
- **Data Sources API** - CRUD operations via `/api/v1/data-sources`
- **Harvest Schedule API** - Schedule management via `/api/v1/harvest-schedule`
- **Workflows API** - Dynamic workflow loading via `/api/v1/workflows`

#### Utilities and Libraries
- **fetchJSON.js** - Centralized API communication utility
- **Status monitoring patterns** - Reusable patterns for real-time status checking
- **Cron expression interpretation** - Human-readable cron translation

### Changed

#### API Responses Handling
- Updated data source handling to support both array and string URL formats
- Enhanced error handling for API communication failures
- Improved status response parsing (using response directly instead of response.status)

#### UI/UX Improvements
- Color-coded status indicators throughout harvest system
- Enhanced grid layouts with proper column sizing
- Improved tooltip system with detailed examples
- Better visual separation between sections

#### Navigation Structure
- Added Harvest tab to main navigation
- Implemented sub-tab navigation within Harvest section
- Updated tab naming: "Harvesting Plan" → "Harvest Schedule"

### Technical Improvements

#### Performance Optimizations
- Implemented `useCallback` and `useMemo` for optimal re-rendering
- Used `useRef` for stable interval references
- Optimized AG-Grid configurations for better performance

#### Code Quality
- Consistent error handling patterns across components
- Proper cleanup of intervals and event listeners
- Enhanced TypeScript-like prop validation

#### State Management
- Improved local state management with proper dependency arrays
- Better separation of concerns between components
- Consistent state update patterns

### Documentation

#### New Documentation Files
- **HARVEST_SYSTEM.md** - Comprehensive data harvesting system documentation
- **API.md** - Complete API endpoint documentation
- **DEVELOPMENT.md** - Development guide with coding standards
- **DEPLOYMENT.md** - Deployment guide for various environments
- **CHANGELOG.md** - This changelog file

#### Updated Documentation
- **README.md** - Updated with latest features and architecture
- Enhanced project structure documentation
- Added comprehensive feature descriptions

### Infrastructure

#### Environment Configuration
- Enhanced environment variable handling
- Improved build configuration for production
- Better error handling for missing configuration

#### Development Tools
- Enhanced development workflow documentation
- Improved debugging tools and patterns
- Better testing infrastructure

## [1.0.0] - 2024-XX-XX

### Initial Release

#### Core Features
- **Authentication System**
  - User login/logout functionality
  - Registration and password reset
  - Session-based authentication

#### Product Management
- **ProductsTab.jsx** - Product catalog browsing and management
- **CategoryTree.jsx** - Hierarchical category navigation
- **ProductTable.jsx** - Product listing and display

#### Analysis System
- **AnalysesTab.jsx** - Analysis creation and configuration
- **ResultsTab.jsx** - Analysis results visualization
- **BasketsTab.jsx** - Shopping basket management

#### Core Infrastructure
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **AG-Grid Community** - Professional data grids
- **React JSON Schema Form** - Dynamic form generation

#### Internationalization
- **Multi-language support** - Czech, Slovak, English
- **LanguageContext.jsx** - Language state management
- **LanguageSelector.jsx** - Language switching component

#### UI Components
- **AuthPage.jsx** - Authentication page container
- **TopBar.jsx** - Main navigation bar
- **LoginForm.jsx** - User login form
- **RegisterForm.jsx** - User registration form

#### Configuration and Schemas
- **analysisSettings.js** - Analysis configuration schemas
- **translations.js** - Multi-language translations

---

## Version Numbering

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards compatible manner
- **PATCH** version when making backwards compatible bug fixes

## Migration Guides

### Migrating to v2.0.0

#### New Dependencies
No new external dependencies were added in v2.0.0. All new functionality uses existing libraries.

#### Breaking Changes
- None. Version 2.0.0 is fully backwards compatible with v1.0.0

#### New Features
- Data Harvesting System is completely new and optional
- Enhanced ProductGrid requires backend support for `priceCount` and `sellerCount` fields
- WorkflowSelector requires backend `/api/v1/workflows` endpoint

#### Configuration Changes
```javascript
// New environment variables (optional)
VITE_HARVEST_STATUS_INTERVAL=60000  // Status check interval in ms
VITE_ENABLE_HARVEST=true            // Enable harvest features
```

#### API Requirements
```javascript
// New required endpoints for full functionality
GET /api/v1/harvesters
GET /api/v1/harvesters/{id}/status
GET /api/v1/data-sources
GET /api/v1/harvest-schedule
GET /api/v1/workflows

// Enhanced existing endpoints
GET /api/v1/products  // Now includes priceCount, sellerCount
```

## Contributing

When contributing to this project:

1. **Update CHANGELOG.md** - Add entries for all notable changes
2. **Follow version conventions** - Use semantic versioning
3. **Document breaking changes** - Clearly mark any breaking changes
4. **Add migration notes** - Help users upgrade between versions

### Change Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

## Support

For questions about specific versions or upgrade paths:

- **GitHub Issues** - Report bugs or request features
- **Documentation** - Check relevant .md files in this repository
- **API Changes** - Refer to API.md for endpoint changes