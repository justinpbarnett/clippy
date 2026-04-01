import '../popup/styles/popup.css';
import { initApp } from '../popup/App';

// Side panel reuses the popup app with adjusted sizing
const root = document.getElementById('app');
if (root) {
  root.style.width = '100%';
  root.style.maxHeight = '100vh';
  initApp(root);
}
