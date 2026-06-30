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

function StarIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={filled ? 'star-filled' : ''}>
      <path d={filled 
        ? "M12 2l3.09 6.26L22 9.27l-7.5 7.29 1.77 10.34L12 19.77l-9.27 4.87L4.5 16.56 -3 9.27l6.91-1.01L12 2z"
        : "M12 2l3.09 6.26L22 9.27l-7.5 7.29 1.77 10.34L12 19.77l-9.27 4.87L4.5 16.56 -3 9.27l6.91-1.01L12 2zm0 2.69l-2.3 4.66h-4.95l4 3.88-.98 6.08L12 15.75l3.23 3.56-.98-6.08 4-3.88h-4.95L12 4.69z"
      } />
    </svg>
  )
}


function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, isDangerous = false }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="button" 
            className={isDangerous ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ isOpen, item, onClose, onSave, tempTitle, tempDescription, setTempTitle, setTempDescription }) {
  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-edit" onClick={(e) => e.stopPropagation()}>
        <h2>Edit note</h2>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Title</span>
            <input
              type="text"
              placeholder="What is this about?"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              autoFocus
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              rows="4"
              placeholder="Add a few details while they are still fresh."
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function App() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [tempTitle, setTempTitle] = useState('')
  const [tempDescription, setTempDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const itemsCount = items.length

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
    const matchesFavorite = showFavoritesOnly ? item.is_favorite : true
    return matchesSearch && matchesFavorite
  })

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
    setTempTitle(item.title)
    setTempDescription(item.description)
    setEditModal(item)
  }

  const handleDeleteClick = (item) => {
    setConfirmDelete(item)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return

    try {
      await axios.delete(`${API_BASE_URL}/api/items/${confirmDelete.id}`)
      if (editingId === confirmDelete.id) {
        resetForm()
      }
      setError('')
      await fetchItems()
      setConfirmDelete(null)
    } catch (requestError) {
      setError('Failed to delete item.')
    }
  }

  const handleCancelDelete = () => {
    setConfirmDelete(null)
  }

  const handleCloseEditModal = () => {
    setEditModal(null)
    setTempTitle('')
    setTempDescription('')
  }

  const handleSaveEdit = async () => {
    if (!tempTitle.trim()) {
      setError('Title is required.')
      return
    }

    if (!editModal) return

    const payload = {
      title: tempTitle.trim(),
      description: tempDescription.trim(),
    }

    try {
      await axios.put(`${API_BASE_URL}/api/items/${editModal.id}`, payload)
      setError('')
      await fetchItems()
      handleCloseEditModal()
    } catch (requestError) {
      setError('Failed to save changes.')
    }
  }

  const handleToggleFavorite = async (item) => {
    console.log('Toggling favorite for:', item);
    try {
      const payload = { is_favorite: !item.is_favorite };
      console.log('Sending PATCH with:', payload);
      
      const response = await axios.patch(`${API_BASE_URL}/api/items/${item.id}`, payload);
      console.log('Response:', response.data);
      
      setError('')
      await fetchItems()
    } catch (requestError) {
      console.error('Toggle favorite error:', requestError.response?.data || requestError.message);
      setError('Failed to update favorite status.')
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
                <h2>Write something down</h2>
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
                Add note
              </button>
            </div>
          </form>

          <section className="notes-card" aria-label="Notes list">
            <div className="card-heading">
              <div>
                <p className="section-kicker">Recent notes</p>
                <h2>Your collection</h2>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  className={`filter-btn ${showFavoritesOnly ? 'active' : ''}`}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  title={showFavoritesOnly ? 'Show all notes' : 'Show favorites only'}
                >
                  <StarIcon filled={showFavoritesOnly} />
                  {showFavoritesOnly ? 'Favorites' : 'All'}
                </button>
              )}
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {error && <p className="error">{error}</p>}

            {loading ? (
              <p className="status">Loading your notes...</p>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <p className="empty-title">Nothing here yet</p>
                <p className="empty-copy">Start with one note and keep your thoughts together.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                <p className="empty-title">No notes found</p>
                <p className="empty-copy">Try a different search term.</p>
              </div>
            ) : (
              <div className="notes-list">
                {filteredItems.map((item) => (
                  <article className="note-card" key={item.id}>
                    <div className="note-main">
                      <h3>{item.title}</h3>
                      <p>{item.description || 'No description yet.'}</p>
                    </div>

                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-btn star-btn"
                        onClick={() => handleToggleFavorite(item)}
                        aria-label={`${item.is_favorite ? 'Remove from' : 'Add to'} favorites`}
                        title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <StarIcon filled={item.is_favorite} />
                      </button>
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
                        onClick={() => handleDeleteClick(item)}
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

      <ConfirmationModal
        isOpen={confirmDelete !== null}
        title="Delete note?"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDangerous={true}
      />

      <EditModal
        isOpen={editModal !== null}
        item={editModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        tempTitle={tempTitle}
        tempDescription={tempDescription}
        setTempTitle={setTempTitle}
        setTempDescription={setTempDescription}
      />
    </main>
  )
}

export default App