# API Documentation

## Base Configuration

- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable
- **Default**: `http://localhost:8000`
- **Content-Type**: `application/json`
- **Authentication**: Session-based authentication

## Authentication Endpoints

### POST /api/v1/auth/login
Authenticate user and create session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "user@example.com",
    "name": "User Name"
  }
}
```

### POST /api/v1/auth/logout
Destroy user session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/v1/auth/register
Register new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "name": "string"
}
```

## Product Management

### GET /api/v1/products
Retrieve product catalog with enhanced metadata.

**Query Parameters:**
- `category` - Filter by category ID
- `search` - Text search in product names
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Product Name",
      "category": "Electronics",
      "priceCount": 15,
      "sellerCount": 8,
      "description": "Product description",
      "created_at": "2025-10-05T10:00:00Z"
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### GET /api/v1/categories
Retrieve product categories tree.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Electronics",
      "parent_id": null,
      "children": [
        {
          "id": 2,
          "name": "Computers",
          "parent_id": 1
        }
      ]
    }
  ]
}
```

## Basket Management

### GET /api/v1/baskets
List user baskets.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Shopping Basket 1",
      "description": "Basket description",
      "products": [
        {
          "product_id": 1,
          "quantity": 2
        }
      ],
      "created_at": "2025-10-05T10:00:00Z"
    }
  ]
}
```

### POST /api/v1/baskets
Create new basket.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "products": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

## Analysis System

### GET /api/v1/workflows
Retrieve available analysis workflows.

**Response:**
```json
{
  "items": [
    {
      "id": "price_analysis",
      "name": "Price Analysis",
      "description": "Analyze price trends and patterns",
      "schema": {
        "type": "object",
        "properties": {
          "timeframe": {
            "type": "string",
            "enum": ["7d", "30d", "90d"]
          }
        }
      }
    }
  ]
}
```

### POST /api/v1/analyses
Create new analysis.

**Request Body:**
```json
{
  "name": "string",
  "workflow_id": "price_analysis",
  "basket_ids": [1, 2],
  "settings": {
    "timeframe": "30d",
    "includeCompetitors": true
  }
}
```

### GET /api/v1/analyses
List user analyses.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Analysis Name",
      "workflow_id": "price_analysis",
      "status": "completed",
      "created_at": "2025-10-05T10:00:00Z",
      "completed_at": "2025-10-05T10:30:00Z"
    }
  ]
}
```

### GET /api/v1/results/{analysis_id}
Retrieve analysis results.

**Response:**
```json
{
  "analysis_id": 1,
  "status": "completed",
  "results": {
    "summary": {
      "total_products": 50,
      "price_changes": 15
    },
    "data": [
      {
        "product_id": 1,
        "price_trend": "increasing",
        "variance": 12.5
      }
    ]
  }
}
```

## Data Harvesting

### GET /api/v1/harvesters
List all data harvesters.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Harvester 1",
      "host": "192.168.1.100",
      "upload": 50.5,
      "download": 100.2,
      "ping": 15,
      "startedAt": "2025-10-05T10:00:00Z",
      "isOnline": true
    }
  ]
}
```

### GET /api/v1/harvesters/{id}/status
Get real-time harvester status.

**Response:**
```json
{
  "status": "online",
  "networkPerformance": {
    "upload": 50.5,
    "download": 100.2,
    "ping": 15
  },
  "lastCheck": "2025-10-05T15:30:00Z",
  "uptime": 3600
}
```

### DELETE /api/v1/harvesters/{id}
Remove harvester.

**Response:**
```json
{
  "success": true,
  "message": "Harvester deleted successfully"
}
```

### GET /api/v1/data-sources
List all data sources.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "3d printers",
      "urls": [
        "https://example.com/3d-printers",
        "https://shop.example.com/printers"
      ],
      "created_at": "2025-10-05T14:10:01.000Z",
      "updated_at": "2025-10-05T14:10:01.000Z"
    }
  ]
}
```

### POST /api/v1/data-sources
Create new data source.

**Request Body:**
```json
{
  "name": "string",
  "urls": ["string"]
}
```

### PUT /api/v1/data-sources/{id}
Update data source.

**Request Body:**
```json
{
  "name": "string",
  "urls": ["string"]
}
```

### DELETE /api/v1/data-sources/{id}
Remove data source.

### GET /api/v1/harvest-schedule
List harvest schedules.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "harvester_id": 1,
      "harvester_name": "Harvester 1",
      "datasource_id": 1,
      "datasource_name": "3d printers",
      "cron_expression": "0 9 * * 1-5"
    }
  ]
}
```

### POST /api/v1/harvest-schedule
Create harvest schedule.

**Request Body:**
```json
{
  "harvester_id": 1,
  "datasource_id": 1,
  "cron_expression": "0 9 * * 1-5"
}
```

### PUT /api/v1/harvest-schedule/{id}
Update harvest schedule.

**Request Body:**
```json
{
  "harvester_id": 1,
  "datasource_id": 1,
  "cron_expression": "0 9 * * 1-5"
}
```

### DELETE /api/v1/harvest-schedule/{id}
Remove harvest schedule.

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Optional detailed error information"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `SERVER_ERROR` - Internal server error

## Rate Limiting

- **Default Limit**: 100 requests per minute per user
- **Header**: `X-RateLimit-Remaining` indicates remaining requests
- **Response**: 429 status code when limit exceeded

## Frontend Integration

The frontend uses `fetchJSON` utility function for all API communication:

```javascript
import { fetchJSON } from '../lib/fetchJSON.js';

// GET request
const data = await fetchJSON('/api/v1/products');

// POST request
const result = await fetchJSON('/api/v1/analyses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(analysisData)
});
```

### Error Handling

```javascript
try {
  const data = await fetchJSON('/api/v1/products');
  setProducts(data.items);
} catch (error) {
  console.error('Failed to load products:', error);
  setError('Unable to load products');
}
```