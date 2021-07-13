import React from 'react';
import Tab from './tab';
import './app.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      children: [],
    }
  }

  componentDidMount() {
    this.addTab();
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          Fastab
        </header>
        <button onClick={() => this.addTab()}>Add Tab</button>
        <div id="tab-wrapper">
          {this.state.children}
        </div>
      </div>
    );
  }

  addTab() {
    this.setState({
      children: [
        ...this.state.children,
        <Tab key={this.state.children.length}/>
      ]
    });
  }
}

export default App;
