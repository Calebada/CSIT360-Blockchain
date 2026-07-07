const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

app.use(cors());
app.use(express.json());


const initializeDatabase = async() => {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_favorite BOOLEAN DEFAULT FALSE
    )
  `);

    // Add is_favorite column if it doesn't exist (for existing tables)
    try {
        await pool.query(`
            ALTER TABLE items ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE
        `);
    } catch (error) {
        // Column might already exist, ignore error
    }
};

app.get('/api/items', async(req, res) => {
    try {
        const result = await pool.query('SELECT id, title, description, is_favorite FROM items ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch items.' });
    }
});

app.post('/api/items', async(req, res) => {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO items (title, description, is_favorite) VALUES ($1, $2, $3) RETURNING id, title, description, is_favorite', [title.trim(), description ? description.trim() : '', false]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create item.' });
    }
});

app.put('/api/items/:id', async(req, res) => {
    const id = Number(req.params.id);
    const { title, description } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required.' });
    }

    try {
        const result = await pool.query(
            'UPDATE items SET title = $1, description = $2 WHERE id = $3 RETURNING id, title, description, is_favorite', [title.trim(), description ? description.trim() : '', id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update item.' });
    }
});

// PATCH endpoint for favorites
app.patch('/api/items/:id', async(req, res) => {
    const id = Number(req.params.id);
    const { is_favorite } = req.body;

    console.log(`✅ PATCH request received for item ${id}`, { is_favorite });

    if (typeof is_favorite !== 'boolean') {
        console.error('❌ Invalid is_favorite type:', typeof is_favorite);
        return res.status(400).json({ message: 'is_favorite must be a boolean.' });
    }

    try {
        const result = await pool.query(
            'UPDATE items SET is_favorite = $1 WHERE id = $2 RETURNING id, title, description, is_favorite', [is_favorite, id]
        );

        if (result.rowCount === 0) {
            console.error('❌ Item not found:', id);
            return res.status(404).json({ message: 'Item not found.' });
        }

        console.log('✅ Favorite updated:', result.rows[0]);
        return res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ PATCH error:', error.message);
        return res.status(500).json({ message: 'Failed to update favorite status.', error: error.message });
    }
});

app.delete('/api/items/:id', async(req, res) => {
    const id = Number(req.params.id);

    try {
        const result = await pool.query('DELETE FROM items WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ message: 'Failed to delete item.' });
    }
});

const startServer = async() => {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log('Available routes: GET/POST /api/items, PUT/PATCH/DELETE /api/items/:id');
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

startServer();