import ReactDom from 'react-dom/client'; 

import './index.css';
import App from './App';

const container = document.getElementById('root');
const root = ReactDom.createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<App tab="home" />); 

 