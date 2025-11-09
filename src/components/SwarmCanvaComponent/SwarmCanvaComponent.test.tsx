import ReactDOM from 'react-dom';
import SwarmCanvaComponent from './SwarmCanvaComponent';

it('It should mount', () => {
  const div = document.createElement('div');
  ReactDOM.render(<SwarmCanvaComponent />, div);
  ReactDOM.unmountComponentAtNode(div);
});