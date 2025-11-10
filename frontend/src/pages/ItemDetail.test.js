import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ItemDetail from './ItemDetail';

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

const renderWithRoute = (initialPath) =>
    render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/items/:id" element={<ItemDetail />} />
            </Routes>
        </MemoryRouter>
    );

test('renders item details for a valid id', async () => {
    const item = {
        id: 1,
        name: 'Laptop Pro',
        category: 'Electronics',
        price: 2499,
    };

    fetch.mockResolvedValueOnce(makeResponse(item));

    renderWithRoute('/items/1');

    // loading state
    expect(screen.getByText(/loading item/i)).toBeInTheDocument();

    // item loaded
    expect(await screen.findByText('Laptop Pro')).toBeInTheDocument();
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByText(/\$2499/)).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/1'),
        expect.any(Object)
    );
});

test('shows not-found message when backend returns 404', async () => {
    fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Item not found' }),
    });

    renderWithRoute('/items/999');

    expect(
        await screen.findByText(/item not found/i)
    ).toBeInTheDocument();
});

test('shows generic error message when backend fails', async () => {
    fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Boom' }),
    });

    renderWithRoute('/items/1');

    expect(
        await screen.findByText(/failed to load item/i)
    ).toBeInTheDocument();
});
