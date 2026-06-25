# CRUD Application - Technical Explanation

## Project Overview

This is a full-stack CRUD (Create, Read, Update, Delete) application built with **React**, **Node.js/Express**, and **Supabase PostgreSQL**. It allows users to manage tasks in a clean, modern web interface with real-time database persistence.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                   http://localhost:5173                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - React Components (App.jsx)                         │   │
│  │ - Axios HTTP Client for API calls                   │   │
│  │ - CSS styling with responsive design                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST API calls
                             │ (axios)
┌────────────────────────────▼────────────────────────────────┐
│                  Backend (Node.js + Express)                │
│                   http://localhost:5000                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Express.js REST API routes                        │   │
│  │ - pg (Node PostgreSQL driver)                       │   │
│  │ - CORS middleware for cross-origin requests        │   │
│  │ - JSON request/response handling                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ SQL queries
                             │ (pg driver)
┌────────────────────────────▼────────────────────────────────┐
│           Database (Supabase PostgreSQL)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - PostgreSQL database hosted on Supabase            │   │
│  │ - "items" table with CRUD operations                │   │
│  │ - Credentials in backend/.env file                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend (React)

### Location: `frontend/src/App.jsx`

**Key Components:**

```javascript
// State management
const [items, setItems] = useState([])        // Stores all tasks
const [title, setTitle] = useState('')        // Form input: task title
const [description, setDescription] = useState('')  // Form input: task description
const [editingId, setEditingId] = useState(null)  // Tracks which item is being edited
const [loading, setLoading] = useState(true)  // Loading state for API calls
const [error, setError] = useState('')        // Error message display
```

**Key Functions:**

1. **fetchItems()** - Reads all items from the database
   - Makes GET request to `/api/items`
   - Updates React state with response data
   - Handles loading and error states

2. **handleSubmit()** - Creates or updates an item
   - Validates title is not empty
   - Sends POST request for new items
   - Sends PUT request for updates
   - Refreshes the items list after success

3. **handleEdit()** - Prepares an item for editing
   - Populates form fields with selected item data
   - Sets editingId to track which item is being modified

4. **handleDelete()** - Removes an item from database
   - Sends DELETE request with item ID
   - Resets edit form if deleting the current edit target
   - Refreshes items list after deletion

**Styling:** `frontend/src/App.css`
- Modern glassmorphism design (semi-transparent surfaces)
- Responsive grid layout
- Gradient buttons with hover effects
- Mobile-first responsive design

---

## Backend (Node.js + Express)

### Location: `backend/index.js`

**Configuration:**

```javascript
// Environment variables loaded from .env file
require('dotenv').config()
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})
```

**Database Initialization:**

```javascript
const initializeDatabase = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT DEFAULT ''
        )
    `)
}
```
- Runs once when server starts
- Creates `items` table if it doesn't exist
- Uses PostgreSQL SERIAL for auto-incrementing IDs

**API Endpoints:**

### 1. GET `/api/items`
```javascript
app.get('/api/items', async (req, res) => {
    const result = await pool.query(
        'SELECT id, title, description FROM items ORDER BY id DESC'
    )
    res.json(result.rows)
})
```
- Fetches all items from database
- Orders by most recent first (DESC)
- Returns array of task objects

### 2. POST `/api/items`
```javascript
app.post('/api/items', async (req, res) => {
    const { title, description } = req.body
    
    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required.' })
    }
    
    const result = await pool.query(
        'INSERT INTO items (title, description) VALUES ($1, $2) RETURNING id, title, description',
        [title.trim(), description ? description.trim() : '']
    )
    return res.status(201).json(result.rows[0])
})
```
- Validates title is not empty
- Inserts new item into database
- Returns newly created item with auto-generated ID
- Status 201 = Created successfully

### 3. PUT `/api/items/:id`
```javascript
app.put('/api/items/:id', async (req, res) => {
    const id = Number(req.params.id)
    const { title, description } = req.body
    
    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required.' })
    }
    
    const result = await pool.query(
        'UPDATE items SET title = $1, description = $2 WHERE id = $3 RETURNING id, title, description',
        [title.trim(), description ? description.trim() : '', id]
    )
    
    if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Item not found.' })
    }
    
    return res.json(result.rows[0])
})
```
- Updates existing item by ID
- Returns status 404 if item not found
- Returns updated item data

### 4. DELETE `/api/items/:id`
```javascript
app.delete('/api/items/:id', async (req, res) => {
    const id = Number(req.params.id)
    
    const result = await pool.query('DELETE FROM items WHERE id = $1', [id])
    
    if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Item not found.' })
    }
    
    return res.status(204).send()
})
```
- Deletes item by ID
- Returns status 204 = No Content (successful delete with no response body)
- Returns 404 if item doesn't exist

**CORS Configuration:**
```javascript
app.use(cors())
```
- Allows frontend (different port) to make requests to backend
- Essential for local development with separate frontend/backend servers

---

## Database (Supabase PostgreSQL)

### Connection Details
```
Host: aws-1-ap-southeast-1.pooler.supabase.com
Port: 6543
Database: postgres
User: postgres.ayxxcrbjvbxqrkplsyns
```

### Table Schema
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,           -- Auto-incrementing integer ID
    title TEXT NOT NULL,              -- Task title (required)
    description TEXT DEFAULT ''       -- Task description (optional)
)
```

---

## Data Flow Examples

### Creating a Task
```
User enters title/description → Frontend form submit
→ handleSubmit() validates input
→ axios.post('/api/items', {title, description})
→ Backend receives POST request
→ INSERT INTO items query executes
→ PostgreSQL returns new item with ID
→ Backend sends 201 response with item data
→ Frontend fetches all items
→ React re-renders with new item in list
```

### Updating a Task
```
User clicks Edit → handleEdit() fills form with item data
User modifies data → handleSubmit() detects editingId is set
→ axios.put(`/api/items/${id}`, {title, description})
→ Backend UPDATE query executes
→ PostgreSQL returns updated item
→ Frontend fetches all items
→ React re-renders list with updated data
```

### Deleting a Task
```
User clicks Delete → handleDelete(id)
→ axios.delete(`/api/items/${id}`)
→ Backend DELETE query executes
→ PostgreSQL removes row
→ Backend sends 204 No Content response
→ Frontend fetches all items
→ React re-renders without deleted item
```

---

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 | UI library for interactive components |
| Frontend | Vite | Fast build tool and dev server |
| Frontend | Axios | HTTP client for API calls |
| Backend | Express.js | Web framework for REST API |
| Backend | Node.js | JavaScript runtime |
| Backend | pg | PostgreSQL database driver |
| Backend | dotenv | Load environment variables |
| Backend | CORS | Cross-origin resource sharing |
| Database | Supabase | Hosted PostgreSQL database |

---

## How to Run

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev      # Runs with nodemon for auto-reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev      # Runs Vite dev server
```

Then open `http://localhost:5173` in your browser.

---

## Error Handling

**Frontend:**
- Try-catch blocks catch API errors
- Error state displays user-friendly messages
- Loading state prevents multiple simultaneous requests

**Backend:**
- Validates input data before database operations
- Returns appropriate HTTP status codes (400, 404, 500)
- JSON error responses with descriptive messages

**Database:**
- PostgreSQL enforces NOT NULL constraint on title
- ID collision prevention with SERIAL PRIMARY KEY
- Connection pooling prevents connection exhaustion

