import ReactDOM from 'react-dom';
import WelcomeComponent from './WelcomeComponent';

it('It should mount', () => {
  const div = document.createElement('div');
  ReactDOM.render(<WelcomeComponent />, div);
  ReactDOM.unmountComponentAtNode(div);
});