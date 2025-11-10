import SwarmCanvaComponent from './SwarmCanvaComponent';
import { createRoot } from 'react-dom/client';

it('It should mount', () => {
  const root = createRoot(document.createElement('div'));
  root.render(<SwarmCanvaComponent />);
  root.unmount();
});