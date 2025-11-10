import { createRoot } from 'react-dom/client';
import WelcomeComponent from './WelcomeComponent';

it('It should mount', () => {
  const root = createRoot(document.createElement('div'));
  root.render(<WelcomeComponent />);
  root.unmount();
});