import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Stack } from '@mui/material';

const API_BASE = 'http://localhost:3001';

function StatsSummary() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true; // simple guard so we don’t set state after unmount
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`${API_BASE}/api/stats`);
                if (!res.ok) {
                    throw new Error(`Failed to load stats (${res.status})`);
                }
                const data = await res.json();
                if (isMounted) {
                    setStats(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load stats.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, []);

    if (loading && !stats) {
        return (
            <Typography variant="body2" color="text.secondary">
                Loading stats…
            </Typography>
        );
    }

    if (error) {
        return (
            <Alert severity="warning">
                {error}
            </Alert>
        );
    }

    if (!stats) {
        return null;
    }

    return (
        <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={3}>
                <Typography variant="body2">
                    <strong>Total items:</strong> {stats.total}
                </Typography>
                <Typography variant="body2">
                    <strong>Average price:</strong>{' '}
                    ${stats.averagePrice.toFixed(2)}
                </Typography>
            </Stack>
        </Box>
    );
}

export default StatsSummary;
