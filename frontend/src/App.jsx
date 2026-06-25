import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/items`)
      setItems(response.data)
      setError('')
    } catch (requestError) {
      setError('Failed to fetch items. Check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
    }

    try {
      if (editingId !== null) {
        await axios.put(`${API_BASE_URL}/api/items/${editingId}`, payload)
      } else {
        await axios.post(`${API_BASE_URL}/api/items`, payload)
      }

      resetForm()
      setError('')
      await fetchItems()
    } catch (requestError) {
      setError('Failed to save item.')
    }
  }

  const handleEdit = (item) => {
    setTitle(item.title)
    setDescription(item.description)
    setEditingId(item.id)
    setError('')
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/items/${id}`)
      if (editingId === id) {
        resetForm()
      }
      setError('')
      await fetchItems()
    } catch (requestError) {
      setError('Failed to delete item.')
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <h1>BASIC CRUD </h1>
        <p className="hero-subtitle">
        
        </p>
      </header>

      <form className="item-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          rows="3"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="actions">
          <button type="submit">
            {editingId !== null ? 'Update Item' : 'Add Item'}
          </button>
          {editingId !== null && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="status">Loading items...</p>
      ) : (
        <section className="item-list">
          {items.length === 0 ? (
            <p className="status">No items yet. Add your first task above.</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="item-card">
                <h2>{item.title}</h2>
                <p>{item.description || 'No description'}</p>
                <div className="actions">
                  <button type="button" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  )
}

export default App
