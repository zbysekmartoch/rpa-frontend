# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Environment Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd rpa-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access at http://localhost:5173

## Project Architecture

### Component Structure
```
src/components/
├── AuthPage.jsx          # Authentication container with login/register forms
├── CategoryTree.jsx      # Hierarchical category browser with checkboxes
├── LanguageSelector.jsx  # Language switching dropdown
├── ProductGrid.jsx       # AG Grid-based product table with filters
├── TopBar.jsx           # Main navigation bar (unused)
└── WorkflowSelector.jsx  # Dynamic workflow selection for analyses
```

### Tab-based Architecture
Each main feature is implemented as a tab component:
```
src/tabs/
├── ProductsTab.jsx           # Product catalog with category tree
├── BasketsTab.jsx            # Shopping basket CRUD operations
├── AnalysesTab.jsx           # Analysis container with sub-tabs
├── AnalysisDefinitionTab.jsx # Monaco editor for scripts
├── AnalysisExecutionTab.jsx  # Analysis configuration and execution
├── ResultsTab.jsx            # Analysis results viewer
├── HarvestTab.jsx            # Data harvesting container
├── HarvestersTab.jsx         # Harvester management with status
├── DataSourcesTab.jsx        # Data source URL configuration
├── HarvestScheduleTab.jsx    # Cron-based scheduling
└── SettingsTab.jsx           # User preferences
```

### State Management
- **AuthContext** - User authentication, JWT token handling
- **LanguageContext** - Internationalization (cs/sk/en)
- **SettingsContext** - User preferences (advanced UI toggle)
- **Local State** - Component-specific state with useState

## Coding Standards

### React Patterns

**Functional Components with Hooks**
```javascript
import React, { useState, useEffect, useCallback, useMemo } from 'react';

export default function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Memoized callback to prevent unnecessary re-renders
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchJSON('/api/v1/data');
      setData(result.items);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (/* JSX */);
}
```

### API Communication

Always use `fetchJSON()` wrapper from `lib/fetchJSON.js`:
```javascript
import { fetchJSON } from '../lib/fetchJSON.js';

// GET request (auth token automatically added)
const data = await fetchJSON('/api/v1/endpoint');

// POST request
const result = await fetchJSON('/api/v1/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' }),
});
```

For direct fetch calls (file uploads, etc.), always include Authorization header:
```javascript
await fetch('/api/v1/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  },
  body: formData
});
```

### AG Grid Configuration

Use centralized configuration from `lib/gridConfig.js`:
```javascript
import { 
  defaultColDef, 
  commonGridProps, 
  getGridContainerStyle 
} from '../lib/gridConfig.js';

// In component:
<div className="ag-theme-quartz" style={getGridContainerStyle()}>
  <AgGridReact
    {...commonGridProps}
    rowData={data}
    columnDefs={columns}
    defaultColDef={defaultColDef}
    tooltipShowDelay={300}
  />
</div>
```

For grids with client-side filtering (ProductGrid):
```javascript
import { 
  defaultColDefWithFilter,
  textFilterParams,
  numberFilterParams 
} from '../lib/gridConfig.js';

const columnDefs = [
  { 
    headerName: 'Name', 
    field: 'name',
    filter: 'agTextColumnFilter',
    filterParams: textFilterParams
  },
  { 
    headerName: 'Count', 
    field: 'count',
    filter: 'agNumberColumnFilter',
    filterParams: numberFilterParams
  }
];
```

### Translations

Add all user-facing strings to `i18n/translations.js`:
```javascript
export const translations = {
  cs: {
    myNewKey: 'Český text',
  },
  sk: {
    myNewKey: 'Slovenský text',
  },
  en: {
    myNewKey: 'English text',
  }
};
```

Use in components:
```javascript
const { t } = useLanguage();
return <span>{t('myNewKey')}</span>;
```

### Comments

All code comments should be in English:
```javascript
// Load products when category changes
useEffect(() => {
  loadProducts(categoryId);
}, [categoryId, loadProducts]);

/**
 * Calculate price statistics for selected products
 * @param {number[]} productIds - Array of product IDs
 * @returns {Promise<object>} - Statistics object
 */
const calculateStats = async (productIds) => {
  // Implementation
};
```

## Adding New Features

### Adding a New Tab

1. Create component in `src/tabs/NewTab.jsx`:
   ```javascript
   /**
    * New Feature Tab
    * Brief description of functionality
    */
   export default function NewTab() {
     const { t } = useLanguage();
     return <div>{t('newTabContent')}</div>;
   }
   ```

2. Add to `App.jsx`:
   ```javascript
   import NewTab from './tabs/NewTab.jsx';
   
   // In AppContent, add TabButton and content div
   ```

3. Add translations to `i18n/translations.js`

### Adding AG Grid Column Filters

For ProductGrid-style filtering:
1. Import filter params from `gridConfig.js`
2. Add filter configuration to column definition
3. Enable `floatingFilter={true}` on grid

### Adding Monaco Editor Features

The script editor in AnalysisDefinitionTab uses:
- `@monaco-editor/react` package
- Language detection from file extension
- Theme stored in localStorage
- Open in new window with CDN-loaded Monaco

## Testing

### Manual Testing Checklist
- [ ] Login/logout works correctly
- [ ] Tab switching preserves state
- [ ] Grid filtering and sorting works
- [ ] API errors show user-friendly messages
- [ ] All three languages display correctly

## Build & Deployment

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview

# Lint code
npm run lint
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.
