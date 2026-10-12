import { createRoot } from 'react-dom/client';
import App from '../../src/App';
import './app.css';

createRoot(document.getElementById('root')!).render(<App portal="customer" />);
