import './WelcomeComponent.scss';
import { type FC } from 'react';


interface WelcomeComponentProps {}

const WelcomeComponent: FC<WelcomeComponentProps> = () => (
  <div>
    <h1 className="title mask-1">Welcome</h1>
    <h1 className="title mask-2">Welcome</h1>
  </div>
);

export default WelcomeComponent;
