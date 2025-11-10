import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';

const DataContext = createContext(null);

const API_BASE = 'http://localhost:3001';

// Shared data context for items list — wraps fetching, pagination & error state
export function DataProvider({ children }) {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Centralized fetch function; cancels safely on unmount (see Items.js)
    const fetchItems = useCallback(
        async (options = {}) => {
            const { q, page, pageSize, signal } = options;

            setLoading(true);

            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (page) params.set('page', String(page));
            if (pageSize) params.set('pageSize', String(pageSize));

            // server-side filtering and pagination
            const url = `${API_BASE}/api/items${
                params.toString() ? `?${params.toString()}` : ''
            }`;

            try {
                const res = await fetch(url, { signal });

                if (!res.ok) {
                    const err = new Error(`Failed to load items (${res.status})`);
                    err.status = res.status;
                    throw err;
                }

                const data = await res.json();

                // Handle both array and { items, meta }
                const nextItems = Array.isArray(data) ? data : data.items || [];
                const nextMeta = Array.isArray(data) ? null : data.meta || null;

                // support both legacy array and new {items, meta} formats
                setItems(nextItems);
                setMeta(nextMeta);
                setError(null);
                setHasLoadedOnce(true);
            } catch (err) {
                if (signal && signal.aborted) return; // prevent setState after unmount
                console.error('fetchItems error', err);
                setError(err);
            } finally {
                if (!signal?.aborted) setLoading(false);
            }
        },
        []
    );

    const value = {
        items,
        meta,
        loading,
        error,
        hasLoadedOnce,
        fetchItems,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used inside <DataProvider>');
    return ctx;
};
