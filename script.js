// Note Taking App JavaScript
class NoteApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentNote = null;
        this.currentCategory = 'all';
        this.searchTerm = '';
        
        this.initializeApp();
        this.bindEvents();
        this.renderNotes();
        this.updateNoteCount();
    }

    initializeApp() {
        // Show welcome screen if no notes exist
        if (this.notes.length === 0) {
            document.getElementById('welcomeScreen').style.display = 'flex';
        } else {
            document.getElementById('welcomeScreen').style.display = 'none';
        }
    }

    bindEvents() {
        // New note button
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
        document.getElementById('welcomeNewNoteBtn').addEventListener('click', () => this.createNewNote());

        // Save note button
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());

        // Delete note button
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteNote());

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderNotes();
        });

        // Category filtering
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.category-item').forEach(cat => cat.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentCategory = e.currentTarget.dataset.category;
                this.renderNotes();
            });
        });

        // Auto-save functionality
        document.getElementById('noteTitle').addEventListener('input', () => this.autoSave());
        document.getElementById('noteContent').addEventListener('input', () => this.autoSave());
        document.getElementById('categorySelect').addEventListener('change', () => this.autoSave());

        // Word count update
        document.getElementById('noteContent').addEventListener('input', () => this.updateWordCount());
    }

    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            category: 'personal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(newNote);
        this.currentNote = newNote;
        this.saveToStorage();
        this.renderNotes();
        this.loadNote(newNote);
        this.hideWelcomeScreen();
    }

    loadNote(note) {
        this.currentNote = note;
        
        // Update UI
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('categorySelect').value = note.category;
        document.getElementById('noteDate').textContent = this.formatDate(note.updatedAt);
        
        // Show delete button
        document.getElementById('deleteNoteBtn').style.display = 'inline-flex';
        
        // Update word count
        this.updateWordCount();
        
        // Update active note in sidebar
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-note-id="${note.id}"]`).classList.add('active');
    }

    saveNote() {
        if (!this.currentNote) return;

        this.currentNote.title = document.getElementById('noteTitle').value;
        this.currentNote.content = document.getElementById('noteContent').value;
        this.currentNote.category = document.getElementById('categorySelect').value;
        this.currentNote.updatedAt = new Date().toISOString();

        this.saveToStorage();
        this.renderNotes();
        this.updateNoteCount();
        
        // Show save confirmation
        this.showNotification('Note saved successfully!', 'success');
    }

    autoSave() {
        if (!this.currentNote) return;
        
        // Debounce auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveNote();
        }, 1000);
    }

    deleteNote() {
        if (!this.currentNote) return;

        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(note => note.id !== this.currentNote.id);
            this.currentNote = null;
            this.saveToStorage();
            this.renderNotes();
            this.updateNoteCount();
            this.clearEditor();
            this.showNotification('Note deleted successfully!', 'success');
            
            // Show welcome screen if no notes left
            if (this.notes.length === 0) {
                this.showWelcomeScreen();
            }
        }
    }

    clearEditor() {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('categorySelect').value = 'personal';
        document.getElementById('noteDate').textContent = '';
        document.getElementById('deleteNoteBtn').style.display = 'none';
        this.updateWordCount();
    }

    renderNotes() {
        const notesList = document.getElementById('notesList');
        const filteredNotes = this.getFilteredNotes();

        if (filteredNotes.length === 0) {
            notesList.innerHTML = `
                <div class="no-notes">
                    <i class="fas fa-sticky-note"></i>
                    <p>No notes found</p>
                </div>
            `;
            return;
        }

        notesList.innerHTML = filteredNotes.map(note => `
            <div class="note-item" data-note-id="${note.id}" onclick="app.loadNote(${JSON.stringify(note).replace(/"/g, '&quot;')})">
                <div class="note-item-title">${note.title || 'Untitled Note'}</div>
                <div class="note-item-preview">${this.getNotePreview(note.content)}</div>
                <div class="note-item-meta">
                    <span class="note-item-category">${note.category}</span>
                    <span>${this.formatDate(note.updatedAt)}</span>
                </div>
            </div>
        `).join('');
    }

    getFilteredNotes() {
        let filtered = this.notes;

        // Filter by category
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(note => note.category === this.currentCategory);
        }

        // Filter by search term
        if (this.searchTerm) {
            filtered = filtered.filter(note => 
                note.title.toLowerCase().includes(this.searchTerm) ||
                note.content.toLowerCase().includes(this.searchTerm)
            );
        }

        // Sort by updated date (newest first)
        return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    getNotePreview(content) {
        if (!content) return 'No content';
        return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    updateWordCount() {
        const content = document.getElementById('noteContent').value;
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        document.getElementById('noteWordCount').textContent = `${wordCount} words`;
    }

    updateNoteCount() {
        const count = this.notes.length;
        document.getElementById('noteCount').textContent = `${count} note${count !== 1 ? 's' : ''}`;
    }

    saveToStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    hideWelcomeScreen() {
        document.getElementById('welcomeScreen').style.display = 'none';
    }

    showWelcomeScreen() {
        document.getElementById('welcomeScreen').style.display = 'flex';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Keyboard shortcuts
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N for new note
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNewNote();
            }
            
            // Ctrl/Cmd + S for save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveNote();
            }
            
            // Ctrl/Cmd + F for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NoteApp();
    window.app.bindKeyboardShortcuts();
});

// Add some sample data for demonstration (only if no notes exist)
document.addEventListener('DOMContentLoaded', () => {
    const existingNotes = JSON.parse(localStorage.getItem('notes')) || [];
    if (existingNotes.length === 0) {
        const sampleNotes = [
            {
                id: '1',
                title: 'Welcome to NotePad!',
                content: 'This is your first note. You can edit it, delete it, or create new ones. Try using the search feature to find notes quickly, and organize them with categories.',
                category: 'personal',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Keyboard Shortcuts',
                content: 'Here are some useful keyboard shortcuts:\n\n• Ctrl/Cmd + N: Create new note\n• Ctrl/Cmd + S: Save current note\n• Ctrl/Cmd + F: Focus search bar\n\nThese shortcuts make note-taking even faster!',
                category: 'ideas',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '3',
                title: 'Project Ideas',
                content: 'Some project ideas to work on:\n\n1. Build a personal website\n2. Learn a new programming language\n3. Create a mobile app\n4. Start a blog\n5. Learn machine learning\n\nWhich one should I tackle first?',
                category: 'work',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('notes', JSON.stringify(sampleNotes));
        
        // Reload the app to show sample notes
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }
});
