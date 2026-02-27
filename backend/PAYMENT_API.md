# Payment API Documentation

## Overview
The payment system has been integrated into the team registration backend. All endpoints now require and validate payment information.

## Database Schema Updates

### TeamRegistration Model
Added payment field to track payment information:

```javascript
payment: {
  transactionId: String (required, unique),
  receiptFileName: String (required),
  status: String (enum: 'pending', 'verified', 'rejected', default: 'pending'),
  verifiedAt: Date (default: null)
}
```

## API Endpoints

### 1. Submit Team Registration with Payment
**Endpoint:** `PUT /api/register`

**Request Body:**
```json
{
  "teamName": "Team Name",
  "teamLeader": {
    "name": "Leader Name",
    "regNo": "12345678901",
    "phoneNo": "9876543210",
    "year": "1",
    "branch": "CSE",
    "section": "A"
  },
  "teamMember1": {
    "name": "Member 1 Name",
    "regNo": "12345678902",
    "phoneNo": "9876543211",
    "year": "1",
    "branch": "CSE",
    "section": "A"
  },
  "teamMember2": {
    "name": "Member 2 Name",
    "regNo": "12345678903",
    "phoneNo": "9876543212",
    "year": "1",
    "branch": "CSE",
    "section": "A"
  },
  "payment": {
    "transactionId": "UPI_TRANSACTION_ID_123",
    "receiptFileName": "receipt.png"
  }
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Team registration and payment submitted successfully",
  "data": {
    "_id": "...",
    "teamName": "Team Name",
    "teamLeader": {...},
    "teamMember1": {...},
    "teamMember2": {...},
    "payment": {
      "transactionId": "UPI_TRANSACTION_ID_123",
      "receiptFileName": "receipt.png",
      "status": "pending",
      "verifiedAt": null
    },
    "submittedAt": "2026-02-27T..."
  }
}
```

**Validation Rules:**
- All team member fields are required
- Team name must be unique
- All registration numbers must be unique
- Payment information is required (transactionId and receiptFileName)
- Transaction ID must be unique
- Max teams limit is checked before saving

---

### 2. Check Payment Status
**Endpoint:** `GET /api/payment-status/:transactionId`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "teamName": "Team Name",
    "paymentStatus": "pending",
    "transactionId": "UPI_TRANSACTION_ID_123",
    "submittedAt": "2026-02-27T...",
    "verifiedAt": null
  }
}
```

**Response (Not Found - 404):**
```json
{
  "success": false,
  "message": "Team not found with this transaction ID"
}
```

---

### 3. Verify Payment (Admin Only)
**Endpoint:** `POST /api/verify-payment`

**Request Body:**
```json
{
  "password": "your_admin_password",
  "transactionId": "UPI_TRANSACTION_ID_123",
  "status": "verified"
}
```

**Valid Status Values:**
- `pending` - Default status
- `verified` - Payment confirmed
- `rejected` - Payment rejected

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Payment status updated to verified",
  "data": {
    "teamName": "Team Name",
    "paymentStatus": "verified",
    "transactionId": "UPI_TRANSACTION_ID_123"
  }
}
```

**Response (Unauthorized - 401):**
```json
{
  "success": false,
  "message": "Invalid password"
}
```

---

### 4. Get All Payments (Admin Only)
**Endpoint:** `GET /api/all-payments?password=your_admin_password`

**Response (Success - 200):**
```json
{
  "success": true,
  "statusCounts": {
    "pending": 5,
    "verified": 10,
    "rejected": 1
  },
  "totalPayments": 16,
  "data": [
    {
      "_id": "...",
      "teamName": "Team A",
      "payment": {
        "transactionId": "TXN_001",
        "status": "verified",
        "receiptFileName": "receipt1.png",
        "verifiedAt": "2026-02-27T..."
      },
      "submittedAt": "2026-02-27T..."
    },
    ...
  ]
}
```

---

### 5. Get Team Count (Existing Endpoint)
**Endpoint:** `GET /api/teams/count`

**Response:**
```json
{
  "success": true,
  "count": 16,
  "maxTeams": 50
}
```

---

### 6. Download Team Data as Excel (Existing Endpoint)
**Endpoint:** `POST /api/download-teams`

**Request Body:**
```json
{
  "password": "your_admin_password"
}
```

**Excel Columns (Updated):**
- S.No
- Team Name
- Member Type
- Name
- Reg No
- Phone No
- email
- Year
- Branch
- Section
- Transaction ID
- Payment Status
- Registered On

---

## Environment Variables Required

Add these to your `.env` file:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
maxTeams=50
adminPassword=your_secure_admin_password
VITE_BACKEND_URL=http://localhost:5000
```

---

## Error Handling

### Common Error Responses:

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Name is required", "Registration number must be 11 digits"]
}
```

**400 - Duplicate Entry:**
```json
{
  "success": false,
  "message": "Transaction ID already exists in the system"
}
```

**400 - Registration Closed:**
```json
{
  "success": false,
  "message": "Registration closed. Maximum limit of 50 teams has been reached"
}
```

**500 - Server Error:**
```json
{
  "success": false,
  "message": "Server error",
  "error": "error details..."
}
```

---

## Payment Status Workflow

1. **Pending** (Initial Status)
   - User submits team form with payment details
   - Transaction ID and receipt file name are stored
   - Status is set to "pending" waiting for admin verification

2. **Verified**
   - Admin verifies the payment details
   - Status is updated to "verified"
   - verifiedAt timestamp is recorded

3. **Rejected**
   - Admin rejects the payment (invalid transaction, insufficient amount, etc.)
   - Status is updated to "rejected"
   - Team is still in the system for reference

---

## Notes

- The receipt file name is stored, but actual file upload/storage should be handled by the frontend (cloud storage like Firebase, AWS S3, etc.)
- Admin password is stored in environment variables for security
- Transaction IDs must be unique to prevent duplicate payments
- Each team can only have one payment record
