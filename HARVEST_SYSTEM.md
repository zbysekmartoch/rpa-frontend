# Data Harvesting System Documentation

## Overview

The Data Harvesting System is a comprehensive solution for automated data collection from various web sources. It consists of three main components: Harvesters, Data Sources, and Harvest Scheduling.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Harvesters    │    │   Data Sources   │    │  Harvest Schedule   │
│                 │    │                  │    │                     │
│ • Status Monitor│    │ • URL Management │    │ • Cron Expressions │
│ • Performance   │────│ • Comment Support│────│ • Auto Scheduling   │
│ • CRUD Ops      │    │ • CRUD Ops       │    │ • CRUD Ops          │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Harvesters

### Features
- **Real-time Status Monitoring**: Automatic status checks every 60 seconds
- **Performance Metrics**: Upload/download speeds, ping monitoring
- **Visual Indicators**: Color-coded status display (green=online, red=offline)
- **Manual Refresh**: On-demand status updates

### API Endpoints
```
GET    /api/v1/harvesters           # List all harvesters
GET    /api/v1/harvesters/{id}/status # Get harvester status
DELETE /api/v1/harvesters/{id}      # Delete harvester
```

### Data Structure
```json
{
  "id": 1,
  "name": "Harvester 1",
  "host": "192.168.1.100",
  "upload": 50.5,
  "download": 100.2,
  "ping": 15,
  "startedAt": "2025-10-05T10:00:00Z",
  "isOnline": true,
  "status": {
    "networkPerformance": {
      "upload": 50.5,
      "download": 100.2,
      "ping": 15
    }
  }
}
```

### Implementation Details
- Status monitoring uses `useRef` for stable interval references
- Color coding applied only to Host column in AG-Grid
- Automatic status refresh every `STATUS_CHECK_INTERVAL` (60 seconds)

## Data Sources

### Features
- **Multiple URL Support**: Each data source can have multiple URLs
- **Comment System**: Lines starting with `#` are treated as comments
- **Flexible Format**: URLs separated by newlines
- **Clickable Links**: Direct navigation to configured URLs

### API Endpoints
```
GET    /api/v1/data-sources         # List all data sources
POST   /api/v1/data-sources         # Create new data source
PUT    /api/v1/data-sources/{id}    # Update data source
DELETE /api/v1/data-sources/{id}    # Delete data source
```

### Data Structure
```json
{
  "id": 1,
  "name": "3d printers",
  "urls": [
    "https://example.com/3d-printers",
    "https://shop.example.com/printers",
    "# This is a comment",
    "https://marketplace.example.com/3d"
  ],
  "created_at": "2025-10-05T14:10:01.000Z",
  "updated_at": "2025-10-05T14:10:01.000Z"
}
```

### URL Format
```
https://example.com/page1
https://example.com/page2
# This is a comment - not rendered as link
https://api.example.com/data
```

## Harvest Scheduling

### Features
- **Cron Expression Support**: Full 5-field cron syntax
- **Human-readable Interpretation**: Automatic translation to plain English
- **Visual Helpers**: Format hints and examples in UI
- **Dropdown Selection**: Choose harvesters and data sources by name

### API Endpoints
```
GET    /api/v1/harvest-schedule     # List all schedules
POST   /api/v1/harvest-schedule     # Create new schedule
PUT    /api/v1/harvest-schedule/{id} # Update schedule
DELETE /api/v1/harvest-schedule/{id} # Delete schedule
```

### Data Structure
```json
{
  "id": 1,
  "harvester_id": 1,
  "harvester_name": "Harvester 1",
  "datasource_id": 1,
  "datasource_name": "3d printers",
  "cron_expression": "0 9 * * 1-5"
}
```

### Cron Expression Format
```
minute hour day month dayOfWeek
  │     │    │    │       │
  │     │    │    │       └─ Day of week (0-6, 0=Sunday)
  │     │    │    └───────── Month (1-12)
  │     │    └────────────── Day of month (1-31)
  │     └─────────────────── Hour (0-23)
  └───────────────────────── Minute (0-59)
```

### Cron Examples
- `0 0 * * *` - Every day at midnight
- `0 9 * * 1-5` - Weekdays at 9 AM
- `0 */6 * * *` - Every 6 hours
- `30 2 1 * *` - 1st day of month at 2:30 AM
- `0 8,20 * * *` - Daily at 8 AM and 8 PM

### Interpretation Function
The `interpretCronExpression()` function converts cron syntax to human-readable text:

```javascript
interpretCronExpression("0 9 * * 1-5")
// Returns: "Runs on Monday through Friday at 09:00"
```

## Frontend Components

### HarvestersTab.jsx
- Real-time status monitoring with visual indicators
- AG-Grid with custom cell styling for Host column
- Automatic refresh functionality
- Manual status refresh button

### DataSourcesTab.jsx
- URL management with array/string conversion
- Comment support in URL display
- AG-Grid with custom cell renderer for URLs
- Edit forms with textarea for multiple URLs

### HarvestScheduleTab.jsx
- Cron expression management with interpretation
- Dropdown selection for harvesters and data sources
- Visual cron helpers with tooltips
- Human-readable schedule interpretation

## Best Practices

### Status Monitoring
- Use `useRef` for stable interval references
- Implement proper cleanup for intervals
- Handle API errors gracefully with offline status

### URL Management
- Support both array and string formats for compatibility
- Filter empty URLs and trim whitespace
- Distinguish comments from actual URLs

### Cron Expressions
- Validate cron format (5 fields required)
- Provide clear error messages for invalid expressions
- Include practical examples in UI tooltips

### Error Handling
- Implement try-catch blocks for all API calls
- Show user-friendly error messages
- Maintain application state during errors

## Troubleshooting

### Status Monitoring Issues
- Check network connectivity to harvester hosts
- Verify API endpoint `/api/v1/harvesters/{id}/status`
- Ensure proper interval cleanup on component unmount

### URL Display Problems
- Verify URL array structure in API response
- Check comment detection (lines starting with `#`)
- Validate URL trimming and filtering

### Cron Expression Errors
- Ensure exactly 5 space-separated fields
- Validate numeric ranges for each field
- Check special character support (*, /, -, ,)