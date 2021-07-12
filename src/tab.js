import React from 'react';
import './tab.css';

class Fret extends React.Component {
  getValue() {
    if (this.isSelected() && this.props.selection.pendingValue) {
      return this.props.selection.pendingValue.padStart(this.props.width, '-')
    }
    if (this.props.value !== null) {
      return this.props.value.padStart(this.props.width, '-');
    }
    return '-'.repeat(this.props.width);
  }

  isSelected() {
    return this.props.selection.beat === this.props.beatIndex &&
        this.props.selection.fret === this.props.fretIndex;
  }

  render() {
    let className = 'fret';
    if (this.isSelected()) {
      className += ' selected';
    }
    return (
      <div
          className={className}
          onClick={() =>
              this.props.onClick(this.props.beatIndex, this.props.fretIndex)}>
        {this.getValue()}
      </div>
    );
  }
}

class Beat extends React.Component {
  getWidth() {
    const pendingValueLength = this.props.selection.pendingValue ?
        this.props.selection.pendingValue.length : 0;
    return Math.max(...this.props.frets, pendingValueLength) >= 10 ? 3 : 2;
  }

  render() {
    return (
      <div className="beat-wrapper">
        {this.props.frets.map((fretValue, index) =>
        <Fret
            key={index}
            beatIndex={this.props.index}
            fretIndex={index}
            selection={this.props.selection}
            value={fretValue}
            onClick={this.props.onClick}
            width={this.getWidth()} />)}
      </div>
    );
  }
}

/**
 * A tab consists of a series of beats, each with 0 or more notes in them. The
 * exact length of a beat doesn't matter for the purposes of transcription, but
 * we do want to be able to line things up with measures/beats eventually.
 */
class Tab extends React.Component {
  constructor(props) {
    super(props);

    const beats = [];
    for (let i = 0; i < 60; i++) {
      addNewBeat(beats);
    }
    this.state = {
      beats,
      selection: {
        beat: null,
        fret: null,
        pendingValue: null,
      }
    };

    this.keyDownListener = (e) => this.onKeyDown(e);
    this.keyPressedListener = (e) => this.onKeyPressed(e);
  }

  onKeyDown(e) {
    if (isArrowKey(e.keyCode)) {
      // Only process arrow keys.
      const curBeat = this.state.selection.beat;
      const curFret = this.state.selection.fret;
      if (curBeat === null || curFret === null) {
        // If there's no current selection, we have nowhere to move to.
        return;
      }
      switch (e.keyCode) {
        case 37: // Left
          this.select(curBeat - 1, curFret);
          break;
        case 38: // Up
          this.select(curBeat, curFret - 1);
          break;
        case 39: // Right
          this.select(curBeat + 1, curFret);
          break;
        case 40: // Down
          this.select(curBeat, curFret + 1);
          break;
        default:
      }
    } else if (e.keyCode === 8) { // Backspace.
      this.setState({
        selection: {
          beat: this.state.selection.beat,
          fret: this.state.selection.fret,
          pendingValue: null,
        }
      });
      this.commitPendingValue();
    }
  }

  onKeyPressed(e) {
    if (!isNaN(parseInt(e.key, 10))) {
      // Only process number keys.
      let pendingValue = this.state.selection.pendingValue ?? '';
      pendingValue += e.key;
      this.setState({
        selection: {
          beat: this.state.selection.beat,
          fret: this.state.selection.fret,
          pendingValue,
        }
      });
    }
  }

  commitPendingValue() {
    const beats = this.cloneBeats();
    beats[this.state.selection.beat][this.state.selection.fret] =
        this.state.selection.pendingValue;
    this.setState({beats});
  }

  cloneBeats() {
    const newBeats = [];
    for (let i = 0; i < this.state.beats.length; i++) {
      newBeats.push([...this.state.beats[i]]);
    }
    return newBeats;
  }

  select(beat, fret) {
    if (beat < 0 || fret < 0 || fret > 5) {
      // Out of bounds, don't update selection.
      return;
    }
    if (this.state.selection.pendingValue) {
      this.commitPendingValue();
    }
    let beats = this.cloneBeats();
    if (beat >= this.state.beats.length) {
      // Need to add a new beat.
      addNewBeat(beats);
    }
    this.setState({
      selection:  {beat, fret},
      beats,
    });
  }

  render() {
    return (
      <div className="tab-main">
        {this.state.beats.map((beat, index) => {
          return <Beat
              key={index}
              index={index}
              frets={beat}
              selection={this.state.selection}
              onClick={(beat, fret) => this.select(beat, fret)}/>;
        })}
      </div>
    );
  }

  componentDidMount() {
    window.addEventListener('keydown', this.keyDownListener);
    window.addEventListener('keypress', this.keyPressedListener);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.keyDownListener);
    window.removeEventListener('keypress', this.keyPressedListener);
  }
}

function addNewBeat(beats) {
  beats.push([null, null, null, null, null, null])
}

function isArrowKey(keyCode) {
  return keyCode >= 37 && keyCode <= 40;
}

export default Tab;
