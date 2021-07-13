import React from 'react';
import './tab.css';

const EMPTY_BEAT = [null, null, null, null, null, null];

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
      beats.push([...EMPTY_BEAT]);
    }
    // TODO: Add ability to select multiple beats.
    // TODO: Add ability to annotate a beat range.
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
    if (isArrowKey(e.keyCode) || isVimMovementKey(e.keyCode)) {
      // Only process arrow keys.
      const curBeat = this.state.selection.beat;
      const curFret = this.state.selection.fret;
      if (curBeat === null || curFret === null) {
        // If there's no current selection, we have nowhere to move to.
        return;
      }
      switch (e.keyCode) {
        case 37: // Left
        case 72: // H
          this.select(curBeat - 1, curFret);
          break;
        case 38: // Up
        case 75: // K
          this.select(curBeat, curFret - 1);
          break;
        case 39: // Right
        case 76: // L
          this.select(curBeat + 1, curFret);
          break;
        case 40: // Down
        case 74: // J
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
    if (this.state.selection.beat === null ||
        this.state.selection.fret === null) {
      return;
    }
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
    else if (e.key === 'i') {
      // Insert beat before the current selection.
      this.commitPendingValue();
      const beats = this.cloneBeats();
      beats.splice(this.state.selection.beat, 0, [...EMPTY_BEAT]);
      this.setState({beats});
    } else if (e.key === 'a') {
      // Insert beat after the current selection.
      this.commitPendingValue();
      const beats = this.cloneBeats();
      beats.splice(this.state.selection.beat + 1, 0, [...EMPTY_BEAT]);
      this.setState({beats});
      this.select(this.state.selection.beat + 1, this.state.selection.fret);
    } else if (e.key === 'd') {
      // Delete the current beat.
      this.commitPendingValue();
      const beats = this.cloneBeats();
      beats.splice(this.state.selection.beat, 1);
      this.setState({beats});
    }
  }

  commitPendingValue() {
    if (this.state.selection.pendingValue === null) {
      return;
    }
    const beats = this.cloneBeats();
    beats[this.state.selection.beat][this.state.selection.fret] =
        this.state.selection.pendingValue;
    this.setState({
      beats,
      selection: {
        beat: this.state.selection.beat,
        fret: this.state.selection.fret,
        pendingValue: null,
      }
    });
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
      beats.push([...EMPTY_BEAT]);
    }
    this.setState({
      selection:  {beat, fret, pendingValue: null},
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

function isArrowKey(keyCode) {
  return keyCode >= 37 && keyCode <= 40;
}

function isVimMovementKey(keyCode) {
  return keyCode === 72 ||
      keyCode === 74 ||
      keyCode === 75 ||
      keyCode === 76;
}

export default Tab;
