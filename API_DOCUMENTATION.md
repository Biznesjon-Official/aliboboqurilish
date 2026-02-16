# API Documentation

## Base URL
```
Production: https://api.aliboboqurilish.uz
Development: http://localhost:5001/api
```

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}

Response: 201 Created
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

#### Verify Token
```
GET /api/auth/verify
Authorization: Bearer <token>

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Products

#### List Products
```
GET /api/products?page=1&limit=20&category=furniture

Response: 200 OK
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 100,
      "category": "furniture",
      "description": "...",
      "images": ["url1", "url2"],
      "stock": 10,
      "rating": 4.5
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

#### Get Product Details
```
GET /api/products/:id

Response: 200 OK
{
  "id": "uuid",
  "name": "Product Name",
  "price": 100,
  "oldPrice": 150,
  "category": "furniture",
  "description": "...",
  "images": ["url1", "url2"],
  "stock": 10,
  "rating": 4.5,
  "reviews": [
    {
      "user": "User Name",
      "rating": 5,
      "comment": "Great product!"
    }
  ]
}
```

#### Create Product (Admin)
```
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Product Name",
  "price": 100,
  "category": "furniture",
  "description": "...",
  "stock": 10
}

Response: 201 Created
{
  "id": "uuid",
  "name": "Product Name",
  ...
}
```

#### Update Product (Admin)
```
PUT /api/products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 120,
  "stock": 15
}

Response: 200 OK
{
  "id": "uuid",
  "name": "Updated Name",
  ...
}
```

#### Delete Product (Admin)
```
DELETE /api/products/:id
Authorization: Bearer <admin_token>

Response: 204 No Content
```

### Orders

#### Create Order
```
POST /api/orders
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerPhone": "+998901234567",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 100
    }
  ],
  "totalAmount": 200,
  "address": "123 Main St"
}

Response: 201 Created
{
  "id": "uuid",
  "customerName": "John Doe",
  "items": [...],
  "totalAmount": 200,
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### List Orders
```
GET /api/orders?status=pending&page=1

Response: 200 OK
{
  "orders": [
    {
      "id": "uuid",
      "customerName": "John Doe",
      "totalAmount": 200,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1
}
```

#### Update Order Status (Admin)
```
PUT /api/orders/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "shipped"
}

Response: 200 OK
{
  "id": "uuid",
  "status": "shipped",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Health Check

#### Server Health
```
GET /api/health

Response: 200 OK
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "status": 400,
    "message": "Invalid request parameters"
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "status": 401,
    "message": "Invalid or missing token"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "status": 403,
    "message": "Admin access required"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "status": 404,
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "status": 500,
    "message": "Internal server error"
  }
}
```

## Rate Limiting

- **Window:** 15 minutes
- **Limit:** 100 requests per window
- **Headers:**
  - `RateLimit-Limit`: Total requests allowed
  - `RateLimit-Remaining`: Requests remaining
  - `RateLimit-Reset`: Unix timestamp when limit resets

## Pagination

Use `page` and `limit` query parameters:
```
GET /api/products?page=1&limit=20
```

Default: page=1, limit=20
Max limit: 100

## Sorting

Use `sort` query parameter:
```
GET /api/products?sort=-price
```

- `-` prefix for descending order
- No prefix for ascending order

## Filtering

Use query parameters for filtering:
```
GET /api/products?category=furniture&minPrice=100&maxPrice=500
```

## WebSocket Events

### Connect
```javascript
const socket = io('https://aliboboqurilish.uz');
```

### Stock Update
```javascript
socket.on('stock-update', (data) => {
  console.log('Stock updated:', data);
});
```

### Order Status
```javascript
socket.on('order-status', (data) => {
  console.log('Order status changed:', data);
});
```

## Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Login
const response = await axios.post('http://localhost:5001/api/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

const token = response.data.token;

// Get products
const products = await axios.get('http://localhost:5001/api/products', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### cURL
```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get products
curl -X GET http://localhost:5001/api/products \
  -H "Authorization: Bearer <token>"
```

## Support

For API issues, check logs and error tracking system.
