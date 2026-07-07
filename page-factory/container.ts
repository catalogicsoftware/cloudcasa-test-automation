import { Component } from './component';

export class Container extends Component {
  get typeOf(): string {
    return 'container';
  }
}
