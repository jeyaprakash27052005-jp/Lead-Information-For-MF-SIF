import { createRoot } from 'react-dom/client';
import HealthCheckApp from '../../src/HealthCheckApp';
import './app.css';

createRoot(document.getElementById('root')!).render(<HealthCheckApp />);
