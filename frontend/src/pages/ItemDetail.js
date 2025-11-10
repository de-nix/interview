import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Stack,
    Paper,
    Alert,
} from '@mui/material';

const API_BASE = 'http://localhost:3001';

function ItemDetail() {
    const {id} = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        setItem(null);

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/items/${id}`, {
                    signal: controller.signal,
                });

                if (res.status === 404) {
                    setError({type: 'notFound', message: 'Item not found.'});
                    return;
                }

                if (!res.ok) {
                    // generic error for non-404 failures
                    setError({
                        type: 'error',
                        message: 'Failed to load item. Please try again.',
                    });
                    return;
                }

                const data = await res.json();
                setItem(data);
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error('ItemDetail fetch error', err);
                setError({
                    type: 'error',
                    message: 'Failed to load item. Please try again.',
                });
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        })();

        return () => controller.abort();
    }, [id]);

    // When load fails, show a clean inline alert instead of silent blank page
    return (
        <Box sx={{p: 2, maxWidth: 800, mx: 'auto'}}>
            <Stack direction="row" spacing={1} sx={{mb: 2}}>
                <Button variant="outlined" onClick={() => navigate(-1)}>
                    ← Back
                </Button>
                <Button variant="text" onClick={() => navigate('/')}>
                    Home
                </Button>
            </Stack>

            {loading && (
                <Typography variant="body1">Loading item...</Typography>
            )}

            {!loading && error?.type === 'notFound' && (
                <Alert severity="warning" sx={{mb: 2}}>
                    {error.message}
                </Alert>
            )}

            {!loading && error?.type === 'error' && (
                <Alert severity="error" sx={{mb: 2}}>
                    {error.message}
                </Alert>
            )}

            {!loading && !error && item && (
                <Paper sx={{p: 2}}>
                    <Typography variant="h5" gutterBottom>
                        {item.name}
                    </Typography>
                    <Typography variant="body1" sx={{mb: 1}}>
                        <strong>Category:</strong> {item.category}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Price:</strong> ${item.price}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}

export default ItemDetail;