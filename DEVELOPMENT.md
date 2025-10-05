# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Environment Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/zbysekmartoch/rpa-frontend.git
   cd rpa-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   VITE_APP_TITLE=RPA Frontend
   ```

4. **Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Project Architecture

### Component Structure
```
src/components/
├── AuthPage.jsx          # Authentication container
├── CategoryTree.jsx      # Hierarchical category browser
├── LanguageSelector.jsx  # Language switching UI
├── ProductGrid.jsx       # Enhanced product grid with AG-Grid
├── TopBar.jsx           # Main navigation bar
└── WorkflowSelector.jsx  # Dynamic workflow selection
```

### Tab-based Architecture
Each main feature is implemented as a tab component:
```
src/tabs/
├── ProductsTab.jsx       # Product catalog management
├── BasketsTab.jsx        # Shopping basket operations
├── AnalysesTab.jsx       # Analysis configuration
├── HarvestTab.jsx        # Data harvesting main container
├── HarvestersTab.jsx     # Harvester management
├── DataSourcesTab.jsx    # Data source configuration
└── HarvestScheduleTab.jsx # Automated scheduling
```

### State Management
- **AuthContext**: User authentication state
- **LanguageContext**: Language preferences
- **Local State**: Component-specific state with useState/useReducer

## Coding Standards

### React Patterns

**Functional Components with Hooks**
```javascript
import React, { useState, useEffect, useCallback, useMemo } from 'react';

export default function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const processedData = useMemo(() => {
    return data.filter(item => item.active);
  }, [data]);

  return (
    <div>
      {loading ? 'Loading...' : `${processedData.length} items`}
    </div>
  );
}
```

**AG-Grid Integration**
```javascript
import { AgGridReact } from 'ag-grid-react';

const cols = useMemo(() => ([
  { headerName: 'ID', field: 'id', width: 90 },
  { headerName: 'Name', field: 'name', flex: 1 },
  { 
    headerName: 'Status', 
    field: 'status',
    cellStyle: (params) => ({
      backgroundColor: params.value === 'active' ? '#dcfce7' : '#fee2e2'
    })
  }
]), []);

<AgGridReact
  theme="legacy"
  rowData={data}
  columnDefs={cols}
  defaultColDef={{ sortable: true, resizable: true }}
  onRowClicked={onRowClicked}
/>
```

### Error Handling

**API Calls**
```javascript
const handleApiCall = async () => {
  try {
    setLoading(true);
    const result = await fetchJSON('/api/v1/endpoint');
    setData(result);
    setError(null);
  } catch (error) {
    setError('Failed to load data');
    console.error('API Error:', error);
  } finally {
    setLoading(false);
  }
};
```

**Form Validation**
```javascript
const validateForm = (data) => {
  const errors = {};
  
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!data.email?.includes('@')) {
    errors.email = 'Valid email is required';
  }
  
  return errors;
};
```

### Styling Guidelines

**Inline Styles for Layout**
```javascript
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#fff'
}}>
```

**Color Palette**
```javascript
const colors = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  border: '#e5e7eb'
};
```

## Feature Implementation

### Adding New Tab

1. **Create Tab Component**
   ```javascript
   // src/tabs/NewFeatureTab.jsx
   import React, { useState, useEffect } from 'react';
   import { fetchJSON } from '../lib/fetchJSON.js';

   export default function NewFeatureTab() {
     const [data, setData] = useState([]);
     
     useEffect(() => {
       loadData();
     }, []);

     const loadData = async () => {
       try {
         const result = await fetchJSON('/api/v1/new-feature');
         setData(result.items);
       } catch (error) {
         console.error('Failed to load data:', error);
       }
     };

     return (
       <div style={{ height: '100%', padding: 16 }}>
         <h2>New Feature</h2>
         {/* Feature implementation */}
       </div>
     );
   }
   ```

2. **Add to Main Navigation**
   ```javascript
   // src/App.jsx
   import NewFeatureTab from './tabs/NewFeatureTab.jsx';

   // Add to tabs array
   const tabs = [
     // ... existing tabs
     { id: 'newfeature', component: NewFeatureTab }
   ];
   ```

3. **Add Translations**
   ```javascript
   // src/i18n/translations.js
   export const translations = {
     cs: {
       // ... existing translations
       newfeature: 'Nová Funkce'
     },
     en: {
       // ... existing translations
       newfeature: 'New Feature'
     }
   };
   ```

### Implementing Real-time Features

**Status Monitoring Pattern**
```javascript
const [status, setStatus] = useState({});
const intervalRef = useRef(null);

const checkStatus = useCallback(async () => {
  try {
    const result = await fetchJSON('/api/v1/status');
    setStatus(result);
  } catch (error) {
    console.error('Status check failed:', error);
  }
}, []);

useEffect(() => {
  // Initial check
  checkStatus();
  
  // Set up interval
  intervalRef.current = setInterval(checkStatus, 60000); // 1 minute
  
  // Cleanup
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [checkStatus]);
```

### Working with AG-Grid

**Custom Cell Renderers**
```javascript
const cellRenderer = (params) => {
  if (params.value?.startsWith('#')) {
    return (
      <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
        {params.value}
      </span>
    );
  }
  
  return (
    <a href={params.value} target="_blank" rel="noopener noreferrer">
      {params.value}
    </a>
  );
};

const columns = [
  {
    headerName: 'URL',
    field: 'url',
    cellRenderer
  }
];
```

**Dynamic Row Styling**
```javascript
const getRowStyle = useCallback((params) => {
  if (params.data.isOnline) {
    return { backgroundColor: '#dcfce7' };
  }
  return null;
}, []);

<AgGridReact
  getRowStyle={getRowStyle}
  // ... other props
/>
```

## Testing

### Component Testing
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});

test('handles click events', () => {
  const handleClick = jest.fn();
  render(<MyComponent onClick={handleClick} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

### API Testing
```javascript
import { fetchJSON } from '../lib/fetchJSON.js';

// Mock fetch for testing
global.fetch = jest.fn();

test('fetchJSON handles success', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: 'test' })
  });

  const result = await fetchJSON('/api/test');
  expect(result.data).toBe('test');
});
```

## Performance Optimization

### Memoization
```javascript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return data.filter(item => item.complex_calculation);
}, [data]);

// Event handlers
const handleClick = useCallback((id) => {
  onItemClick(id);
}, [onItemClick]);

// Component memoization
const MemoizedComponent = React.memo(MyComponent);
```

### AG-Grid Performance
```javascript
// Use immutable data updates
const updateData = useCallback((newItem) => {
  setData(prevData => [...prevData, newItem]);
}, []);

// Disable animations for large datasets
<AgGridReact
  animateRows={false}
  suppressColumnVirtualisation={true}
  // ... other props
/>
```

## Deployment

### Build Process
```bash
# Production build
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run build -- --analyze
```

### Environment Variables
```bash
# .env.production
VITE_API_BASE_URL=https://api.production.com
VITE_APP_TITLE=RPA Production
```

### Docker Deployment
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Troubleshooting

### Common Issues

**CORS Errors**
- Check API base URL configuration
- Verify backend CORS settings
- Use proxy in development if needed

**AG-Grid Display Issues**
- Ensure AG-Grid CSS is imported
- Check theme consistency
- Verify column definitions

**State Management Problems**
- Use useCallback for stable references
- Implement proper dependency arrays
- Avoid direct state mutations

**Performance Issues**
- Profile component renders
- Optimize re-renders with memoization
- Check for memory leaks in intervals

### Debug Tools
- React Developer Tools
- AG-Grid Debug Mode
- Network tab for API calls
- Console logs for state changes