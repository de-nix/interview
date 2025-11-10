import {Routes, Route, Navigate} from 'react-router-dom';
import ItemDetail from "./pages/ItemDetail";
import {DataProvider} from "./state/DataContext";
import Items from "./pages/Items";

// Root router setup; DataProvider wraps everything that needs shared state
function App() {
    return (
        <DataProvider>
            <Routes>
                <Route path="/" element={<Items/>}/>
                <Route path="/items" element={<Navigate to="/" replace/>}/>
                <Route path="/items/:id" element={<ItemDetail/>}/>
            </Routes>
        </DataProvider>
    );
}

export default App;