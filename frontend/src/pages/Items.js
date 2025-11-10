import React, {useEffect, useState, useMemo} from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {List as VirtualizedList} from 'react-window';
import {useData} from '../state/DataContext';

import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    Paper,
    Link,
    Alert,
} from '@mui/material';
import AddItemDialog from "../components/AddItemDialog";

const LIST_HEIGHT = 400;
const ROW_HEIGHT = 56;

// Main list view: handles search, pagination, and AddItemDialog
function Items() {
    const {items, meta, loading, error, hasLoadedOnce, fetchItems} = useData();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [addOpen, setAddOpen] = useState(false);

    // Abort controller prevents memory leaks when unmounting mid-request
    useEffect(() => {
        const controller = new AbortController();

        fetchItems({
            q: search,
            page,
            pageSize,
            signal: controller.signal,
        }).catch((err) => {
            if (err && err.name !== 'AbortError') {
                console.error(err);
            }
        });

        return () => controller.abort();
    }, [search, page, pageSize]);

    const summaryText = useMemo(() => {
        if (!meta || !meta.total) return null;
        const start = (meta.page - 1) * meta.pageSize + 1;
        const end = Math.min(meta.page * meta.pageSize, meta.total);
        return `Showing ${start}-${end} of ${meta.total} items`;
    }, [meta]);

    const Row = ({index, style}) => {
        const item = items[index];
        if (!item) return null;

        return (
            <Box
                component="li"
                sx={{
                    listStyle: 'none',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                }}
                style={style}
            >
                <Link component={RouterLink} to={`/items/${item.id}`} underline="hover">
                    {item.name}
                </Link>
            </Box>
        );
    };

    const isInitialLoading = !hasLoadedOnce;

    return (
        <Box sx={{p: 2, maxWidth: 900, mx: 'auto'}}>
            <Typography variant="h4" gutterBottom>
                Items
            </Typography>
            <Stack
                direction={{xs: 'column', sm: 'row'}}
                spacing={2}
                alignItems={{xs: 'stretch', sm: 'center'}}
                sx={{mb: 2}}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    label="Search items"
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                    size="small"
                />
                {/* Rows per page */}
                <TextField
                    label="Rows/Page"
                    type="number"
                    size="small"
                    sx={{width: 150}}
                    value={pageSize}
                    onChange={(e) => {
                        const raw = Number(e.target.value);
                        const next = Number.isFinite(raw) && raw > 0 ? raw : 1;
                        setPage(1); // reset to first page when page size changes
                        setPageSize(next);
                    }}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                        variant="outlined"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outlined"
                        disabled={loading || !meta || page >= meta.totalPages}
                        onClick={() =>
                            setPage((p) => (meta ? Math.min(meta.totalPages, p + 1) : p + 1))
                        }
                    >
                        Next
                    </Button>
                </Stack>

            </Stack>


            <Box sx={{mb: 1, minHeight: 24}}>
                {summaryText && (
                    <Typography variant="body2" component="span">
                        {summaryText}
                    </Typography>
                )}
                {loading && (
                    <Typography
                        variant="body2"
                        component="span"
                        sx={{ml: 1, color: 'text.secondary'}}
                    >
                        Loading...
                    </Typography>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{mb: 1}}>
                    Failed to load items. Please try again.
                </Alert>
            )}

            {isInitialLoading && (
                <Stack spacing={1} sx={{mb: 2}}>
                    {Array.from({length: 5}).map((_, idx) => (
                        <Paper key={idx} sx={{height: 40, opacity: 0.3}}/>
                    ))}
                </Stack>
            )}

            {!loading && hasLoadedOnce && !items.length && !error && (
                <Typography>No items found. Try adjusting your search.</Typography>
            )}

            {items.length > 0 && (
                <Paper variant="outlined">
                    <VirtualizedList
                        rowCount={items.length}
                        rowHeight={ROW_HEIGHT}
                        style={{height: LIST_HEIGHT, width: '100%'}}
                        rowComponent={Row}
                        rowProps={{items}}
                    />
                </Paper>
            )}
            {/* New Add Item button */}
            <Button
                variant="contained"
                sx={{ml: 2, mt: 2}}
                onClick={() => setAddOpen(true)}
                disabled={loading}
            >
                Add Item
            </Button>
            <AddItemDialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                onCreated={async () => {
                    try {
                        await fetchItems({q: search, page, pageSize});
                    } catch (err) {
                        console.error('Refresh after create failed', err);
                    }
                }}
            />
        </Box>
    );
}

export default Items;
