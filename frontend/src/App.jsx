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
    <main className="app-shell">
      <section className="workspace-card">
        <header className="hero">
          <div className="hero-copy">
            <h1>Notes Application</h1>
            <p className="hero-text">
              Capture quick thoughts, plans, and reminders in a layout that feels a little more considered.
            </p>
          </div>

          <div className="hero-meta">
            <div className="meta-pill">
              <span className="meta-label">Saved notes</span>
              <strong>{itemsCount}</strong>
            </div>
            <div className="meta-pill meta-pill-soft">
              <span className="meta-label">Status</span>
              <strong>{itemsCount ? 'Active' : 'Fresh start'}</strong>
            </div>
          </div>
        </header>

        <div className="workspace-grid">
          <form className="composer-card" onSubmit={handleSubmit}>
            <div className="card-heading">
              <div>
                <p className="section-kicker">New note</p>
                <h2>{editingId !== null ? 'Refine this note' : 'Write something down'}</h2>
              </div>
           
            </div>

            <label className="field">
              <span>Title</span>
              <input
                type="text"
                placeholder="What is this about?"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                rows="4"
                placeholder="Add a few details while they are still fresh."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <div className="actions">
              <button type="submit">
                {editingId !== null ? 'Save changes' : 'Add note'}
              </button>
              {editingId !== null && (
                <button type="button" className="secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <section className="notes-card" aria-label="Notes list">
            <div className="card-heading">
              <div>
                <p className="section-kicker">Recent notes</p>
                <h2>Your collection</h2>
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            {loading ? (
              <p className="status">Loading your notes...</p>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <p className="empty-title">Nothing here yet</p>
                <p className="empty-copy">Start with one note and keep your thoughts together.</p>
              </div>
            ) : (
              <div className="notes-list">
                {items.map((item) => (
                  <article className="note-card" key={item.id}>
                    <div className="note-main">
                      <h3>{item.title}</h3>
                      <p>{item.description || 'No description yet.'}</p>
                    </div>

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
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
