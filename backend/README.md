
# Lurking Finance - Backend

This backend provides Edge Functions for iPhone Shortcuts integration.

## Edge Functions

### 1. get-categories
**Purpose**: Get active categories for dropdowns in Shortcuts
**Endpoint**: `/functions/v1/get-categories`
**Method**: POST
**Input**:
```json
{
  "user_id": "uuid",
  "type": "expense" // or "stock"
}
```
**Output**:
```json
{
  "categories": [
    {"id": "uuid", "name": "Food & Dining", "color": "#ef4444"},
    {"id": "uuid", "name": "Transportation", "color": "#06b6d4"}
  ],
  "count": 2
}
```

### 2. get-cards
**Purpose**: Get active cards for dropdowns in Shortcuts
**Endpoint**: `/functions/v1/get-cards`
**Method**: POST
**Input**:
```json
{
  "user_id": "uuid"
}
```
**Output**:
```json
{
  "cards": [
    {"id": "uuid", "name": "Main Card", "card_type": "debit"},
    {"id": "uuid", "name": "Credit Card", "card_type": "credit"}
  ],
  "count": 2
}
```

### 3. log-transaction
**Purpose**: Log expense transactions from Shortcuts
**Endpoint**: `/functions/v1/log-transaction`
**Method**: POST
**Input**:
```json
{
  "user_id": "uuid",
  "amount": 25.99,
  "description": "Lunch at cafe",
  "category_name": "Food & Dining",
  "card_name": "Main Card"
}
```
**Output**:
```json
{
  "success": true,
  "message": "Transaction logged successfully",
  "transaction_id": "uuid",
  "amount": 25.99,
  "description": "Lunch at cafe"
}
```

### 4. log-stock
**Purpose**: Log stock buy/sell transactions from Shortcuts
**Endpoint**: `/functions/v1/log-stock`
**Method**: POST
**Input**:
```json
{
  "user_id": "uuid",
  "symbol": "AAPL",
  "shares": 10,
  "price_per_share": 150.25,
  "type": "buy" // or "sell"
}
```
**Output**:
```json
{
  "success": true,
  "message": "Buy transaction logged successfully",
  "transaction_id": "uuid",
  "symbol": "AAPL",
  "shares": 10,
  "price_per_share": 150.25,
  "total_amount": 1502.50,
  "type": "buy"
}
```

## Usage with iPhone Shortcuts

These functions are designed to work with iPhone Shortcuts app. Each function:
- Accepts JSON input via POST request
- Returns JSON responses 
- Has CORS enabled for cross-origin requests
- Uses service role key for database access (no auth required)
- Includes comprehensive error handling and logging

The functions will automatically update holdings when stock transactions are logged via the database trigger.
