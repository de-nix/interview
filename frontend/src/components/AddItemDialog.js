import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Button,
    Alert,
} from '@mui/material';

const API_BASE = 'http://localhost:3001';

// Modal form for creating a new item; used inside the Items page
function AddItemDialog({ open, onClose, onCreated }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Reset everything to defaults
    const resetForm = () => {
        setName('');
        setCategory('');
        setPrice('');
        setError(null);
        setSubmitting(false);
    };

    // Prevent closing mid-submit to avoid inconsistent state
    const handleClose = () => {
        if (submitting) return;
        resetForm();
        onClose?.();
    };

    // POST /api/items
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        // client-side validation before hitting API
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }

        // basic numeric validation
        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice)) {
            setError('Price must be a number.');
            return;
        }

        // optimistic UI pattern: block multiple submits
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    category: category.trim() || 'Misc',
                    price: numericPrice,
                }),
            });

            if (!res.ok) {
                let message = `Failed to create item (${res.status})`;
                try {
                    const body = await res.json();
                    if (body && body.message) message = body.message;
                } catch (_) {
                    // ignore JSON parse errors
                }
                throw new Error(message);
            }

            const created = await res.json();

            // let parent refresh the list
            onCreated?.(created);
            resetForm();
            onClose?.();
        } catch (err) {
            // surface backend or network errors to the user
            console.error('AddItemDialog error', err);
            setError(err.message || 'Failed to create item.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={submitting}
                    >
                        {submitting ? 'Saving…' : 'Save'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default AddItemDialog;
