import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataProvider } from '../state/DataContext';
import Items from './Items';

// Mock react-window's List so we don't depend on virtualization details
jest.mock('react-window', () => {
    const List = ({ rowComponent: RowComponent, rowCount, rowProps }) => {
        const arr = Array.from({ length: rowCount });
        return (
            <ul>
                {arr.map((_, index) => (
                    <RowComponent
                        key={index}
                        index={index}
                        style={{}}
                        {...rowProps}
                    />
                ))}
            </ul>
        );
    };

    return {
        __esModule: true,
        List,
        default: List,
    };
});

const renderWithProviders = () =>
    render(
        <BrowserRouter>
            <DataProvider>
                <Items />
            </DataProvider>
        </BrowserRouter>
    );

const makeResponse = (body, ok = true, status = 200) => ({
    ok,
    status,
    json: () => Promise.resolve(body),
});

beforeEach(() => {
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.resetAllMocks();
});

test('renders Items heading and initial items', async () => {
    const items = [
        { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
        { id: 2, name: 'Standing Desk', category: 'Furniture', price: 1199 },
    ];
    const meta = { total: 2, page: 1, pageSize: 20, totalPages: 1 };

    fetch.mockResolvedValueOnce(makeResponse({ items, meta }));

    renderWithProviders();

    expect(
        screen.getByRole('heading', { name: /items/i })
    ).toBeInTheDocument();

    expect(await screen.findByText('Laptop Pro')).toBeInTheDocument();
    expect(screen.getByText('Standing Desk')).toBeInTheDocument();

    // basic URL check
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items'),
        expect.any(Object)
    );
});

test('applies search filter and calls API with q param', async () => {
    const items = [
        { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
        { id: 2, name: 'Standing Desk', category: 'Furniture', price: 1199 },
    ];
    const meta = { total: 2, page: 1, pageSize: 20, totalPages: 1 };

    // First call: initial load
    fetch.mockResolvedValueOnce(makeResponse({ items, meta }));
    // Second call: search results
    fetch.mockResolvedValueOnce(
        makeResponse({
            items: [items[0]],
            meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
        })
    );

    renderWithProviders();

    // Wait for initial items
    await screen.findByText('Laptop Pro');

    const searchBox = screen.getByLabelText(/search items/i);
    fireEvent.change(searchBox, { target: { value: 'Laptop' } });

    // Wait for filtered item (still Laptop Pro)
    await screen.findByText('Laptop Pro');

    expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('q=Laptop'),
        expect.any(Object)
    );
});

test('handles pagination next/previous and passes correct page param', async () => {
    const page1 = [
        { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
    ];
    const page2 = [
        { id: 2, name: 'Standing Desk', category: 'Furniture', price: 1199 },
    ];

    // First call: page=1
    fetch
        .mockResolvedValueOnce(
            makeResponse({
                items: page1,
                meta: { total: 2, page: 1, pageSize: 1, totalPages: 2 },
            })
        )
        // Second call: page=2
        .mockResolvedValueOnce(
            makeResponse({
                items: page2,
                meta: { total: 2, page: 2, pageSize: 1, totalPages: 2 },
            })
        );

    renderWithProviders();

    await screen.findByText('Laptop Pro');

    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    await screen.findByText('Standing Desk');

    expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
    );
});

test('changing rows per page updates pageSize param and resets to page 1', async () => {
    const items = [
        { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
    ];

    fetch
        // initial load with default pageSize (20)
        .mockResolvedValueOnce(
            makeResponse({
                items,
                meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
            })
        )
        // after changing rows input
        .mockResolvedValueOnce(
            makeResponse({
                items,
                meta: { total: 1, page: 1, pageSize: 5, totalPages: 1 },
            })
        );

    renderWithProviders();

    await screen.findByText('Laptop Pro');

    const rowsInput = screen.getByLabelText(/rows/i);
    fireEvent.change(rowsInput, { target: { value: '5' } });

    await waitFor(() => {
        expect(global.fetch).toHaveBeenLastCalledWith(
            expect.stringContaining('pageSize=5'),
            expect.any(Object)
        );
    });
});
test('Add Item dialog posts new item and refreshes list', async () => {
    const initialItems = [
        { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
    ];
    let currentItems = [...initialItems];
    const meta = { total: 1, page: 1, pageSize: 20, totalPages: 1 };

    fetch.mockImplementation((url, options = {}) => {
        const isGet = !options.method || options.method === 'GET';
        if (isGet) {
            return Promise.resolve(
                makeResponse({
                    items: currentItems,
                    meta: {
                        ...meta,
                        total: currentItems.length,
                    },
                })
            );
        }

        // POST /api/items
        if (options.method === 'POST') {
            const body = JSON.parse(options.body);
            const created = {
                id: 999,
                ...body,
            };
            currentItems = [...currentItems, created];
            return Promise.resolve(makeResponse(created));
        }

        return Promise.resolve(makeResponse({}, false, 500));
    });

    renderWithProviders();

    // initial load
    await screen.findByText('Laptop Pro');

    // open dialog
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));

    // wait for dialog form fields
    const nameInput = await screen.findByLabelText(/name/i);
    const categoryInput = screen.getByLabelText(/category/i);
    const priceInput = screen.getByLabelText(/price/i);

    fireEvent.change(nameInput, { target: { value: 'New Gadget' } });
    fireEvent.change(categoryInput, { target: { value: 'Test' } });
    fireEvent.change(priceInput, { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // ensure POST called with correct payload
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/items'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"name":"New Gadget"'),
            })
        );
    });

    // and refreshed list contains new item
    expect(await screen.findByText('New Gadget')).toBeInTheDocument();
});

test('shows error alert when loading items fails', async () => {
    fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal error' }),
    });

    renderWithProviders();

    expect(
        await screen.findByText(/failed to load items/i)
    ).toBeInTheDocument();
});
