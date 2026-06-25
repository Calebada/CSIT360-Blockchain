import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25Zm2.92 2.33H5v-.92l11.06-11.06.92.92L5.92 19.58ZM20.71 6.04a1 1 0 0 0 0-1.41l-1.34-1.34a1 1 0 0 0-1.41 0l-1.3 1.3 3.75 3.75 1.3-1.3Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V4h4a1 1 0 1 1 0 2h-.88l-.73 11.07A2.75 2.75 0 0 1 14.64 20H9.36a2.75 2.75 0 0 1-2.75-2.93L5.88 6H5a1 1 0 1 1 0-2h4v-.25ZM11 4v0h2v0h-2Zm-1.77 2-.66 10.99a.75.75 0 0 0 .75.79h5.36a.75.75 0 0 0 .75-.79L14.77 6H9.23ZM10 9a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

function App() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const itemsCount = items.length

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
        <div className="hero-copy">
          <p className="eyebrow">Task management dashboard</p>
          <h1>BASIC CRUD</h1>
          <p className="hero-text">
            A clean React interface for creating, updating, and deleting tasks.
          </p>
        </div>
        <div className="hero-chip">
          <span className="chip-label">Saved items</span>
          <strong>{itemsCount}</strong>
        </div>
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
        <section className="table-shell" aria-label="Items table">
          {items.length === 0 ? (
            <p className="status">No items yet. Add your first task above.</p>
          ) : (
            <table className="items-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="title-cell">{item.title}</td>
                    <td>{item.description || 'No description'}</td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn edit-btn"
                          onClick={() => handleEdit(item)}
                          aria-label={`Edit ${item.title}`}
                          title="Edit"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete-btn"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Delete ${item.title}`}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  )
}

export default App
