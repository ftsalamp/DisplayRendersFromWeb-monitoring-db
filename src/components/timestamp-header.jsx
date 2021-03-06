import React from 'react';
import '../css/diff-container.css';

/**
 * Display a timestamp selector
 *
 * @class TimestampHeader
 * @extends {React.Component}
 */
export default class TimestampHeader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      cdxData: false,
      showDiff: false,
      showNotFound: false
    };

    this._handleLeftTimestampChange = this._handleLeftTimestampChange.bind(this);

    this._handleRightTimestampChange = this._handleRightTimestampChange.bind(this);

    this._restartPressed = this._restartPressed.bind(this);

    this._showDiffs = this._showDiffs.bind(this);

  }

  _handleRightTimestampChange(){
    const selectedDigest = this.state.cdxData[document.getElementById('timestamp-select-right').selectedIndex][1];
    let allowedSnapshots = this.state.cdxData;
    allowedSnapshots = allowedSnapshots.filter(hash => hash[1] !== selectedDigest);
    this.setState({
      leftSnaps: allowedSnapshots,
      leftSnapElements : this._prepareOptionElements(allowedSnapshots)
    });
  }

  _handleLeftTimestampChange(){
    const selectedDigest = this.state.cdxData[document.getElementById('timestamp-select-left').selectedIndex][1];
    let allowedSnapshots = this.state.cdxData;
    allowedSnapshots = allowedSnapshots.filter(hash => hash[1] !== selectedDigest);
    this.setState({
      rightSnaps: allowedSnapshots,
      rightSnapElements : this._prepareOptionElements(allowedSnapshots)
    });
  }

  render () {
    const Loader = () => this.props.loader;

    if (this.state.showNotFound){
      return(
        <div>
          {this._notFound()}
        </div>);
    }
    if (this.state.showDiff) {
      return(
        <div className="timestamp-header-view">
          {this._showInfo()}
          {this._showTimestampSelector()}
          {this._exportParams()}
        </div>
      );
    }
    if (this.state.cdxData) {
      return (
        <div className="timestamp-header-view">
          {this._showInfo()}
          {this._showTimestampSelector()}
          {this._showOpenLinks()}
        </div>
      );
    }
    return (<div>
      {this._widgetRender()}
      <Loader/>
    </div>
    );
  }

  _exportParams(){
    let timestampA = document.getElementById('timestamp-select-left').value;
    let timestampB = document.getElementById('timestamp-select-right').value;
    window.location.href = `${this.props.conf.urlPrefix}${timestampA}/${timestampB}/${this.props.site}`;
  }

  _widgetRender () {
    if (this.props.fetchCallback) {
      this.props.fetchCallback().then((data => {
        this._prepareData(data);
        if (!this.props.isInitial) {
          this._selectValues();
        }
      }));
    } else {
      var url;
      if (this.props.conf.limit){
        url = `${this.props.conf.cdxServer}search?url=${this.props.site}/&status=200&limit=${this.props.conf.limit}&fl=timestamp,digest&output=json`;
      } else {
        url = `${this.props.conf.cdxServer}search?url=${this.props.site}/&status=200&fl=timestamp,digest&output=json`;
      }
      fetch(url)
        .then(response => response.json())
        .then((data) => {
          if (data && data.length > 0 ){
            if (data.length === 2) {
              let timestamp = data[1][0];
              window.location.href = `${this.props.conf.urlPrefix}${timestamp}//${this.props.site}`;
            }
            this._prepareData(data);
            if (!this.props.isInitial) {
              this._selectValues();
            }
          } else {
            this.props.snapshotsNotFoundCallback();
            this.setState({showNotFound:true});

          }
        });
    }
  }

  _prepareData(data){
    data.shift();
    this.setState({
      cdxData: data,
      leftSnaps : data,
      rightSnaps : data,
      leftSnapElements : this._prepareOptionElements(data),
      rightSnapElements : this._prepareOptionElements(data),
      headerInfo: this._getHeaderInfo(data)
    });
  }

  _prepareOptionElements(data){
    var initialSnapshots = [];
    if (data.length > 0) {
      var yearGroup = this._getYear(data[0][0]);
      initialSnapshots.push(<optgroup key={-1} label={yearGroup}/>);
    }
    for (let i = 0; i < data.length; i++){
      let utcTime = this._getUTCDateFormat(data[i][0]);
      var year = this._getYear(data[i][0]);
      if (year > yearGroup) {
        yearGroup = year;
        initialSnapshots.push(<optgroup key={-i+2} label={yearGroup}/>);
      }
      initialSnapshots.push(<option key = {i} value = {data[i][0]}>{utcTime}</option>);
    }
    return initialSnapshots;
  }

  _getUTCDateFormat (date){
    let year = parseInt(date.substring(0,4), 10);
    let month = parseInt(date.substring(4,6), 10) - 1;
    let day = parseInt(date.substring(6,8), 10);
    let hour = parseInt(date.substring(8,10), 10);
    let minutes = parseInt(date.substring(10,12), 10);
    let seconds = parseInt(date.substring(12,14), 10);

    let niceTime = new Date(Date.UTC(year, month, day, hour, minutes, seconds));
    return (niceTime.toUTCString());
  }

  _getShortUTCDateFormat (date){
    let year = parseInt(date.substring(0,4), 10);
    let month = parseInt(date.substring(4,6), 10) - 1;
    let day = parseInt(date.substring(6,8), 10);
    var shortTime = new Date(Date.UTC(year, month, day));
    shortTime = shortTime.toUTCString();
    shortTime = shortTime.split(' ');
    let retTime = shortTime[0] + ' ' + shortTime[1] + ' ' + shortTime[2] + ' ' + shortTime[3];
    return (retTime);
  }

  _getYear (date) {
    return parseInt(date.substring(0,4), 10);
  }

  _restartPressed () {
    let initialData = this.state.cdxData;
    this.setState({
      leftSnaps : initialData,
      rightSnaps : initialData,
      leftSnapElements : this._prepareOptionElements(initialData),
      rightSnapElements : this._prepareOptionElements(initialData)
    });
  }

  _showTimestampSelector () {
    return (
      <div className="timestamp-container-view">
        <select className="form-control" id="timestamp-select-left" onChange={this._handleLeftTimestampChange}>
          {this.state.leftSnapElements}
        </select>
        <button className="btn btn-default navbar-btn" id="show-diff-btn" onClick={this._showDiffs}>Show differences</button>
        <button className="btn btn-default navbar-btn" id="restart-btn" onClick={this._restartPressed}>Restart</button>
        <select className="form-control" id="timestamp-select-right" onChange={this._handleRightTimestampChange}>
          {this.state.rightSnapElements}
        </select>
      </div>
    );
  }

  _showInfo(){
    return (
      <div>
        {this.state.headerInfo}
        <div id="timestamp-left">Please select a capture</div>
        <div id="timestamp-right">Please select a capture</div>
        <br/>
      </div>
    );
  }

  _showOpenLinks(){
    if(!this.props.isInitial) {
      if (this.props.timestampA) {
        var aLeft = (<a href={this.props.conf.snapshotsPrefix + this.props.timestampA + '/' + this.props.site}
          id="timestamp-left" target="_blank" rel="noopener"> Open in new window</a>);
      }
      if (this.props.timestampB) {
        var aRight = (<a href={this.props.conf.snapshotsPrefix + this.props.timestampB + '/' + this.props.site}
          id="timestamp-right" target="_blank" rel="noopener">
          Open in new window</a>);
      }
      let div = (
        <div>
          {aLeft}
          {aRight}
          <br/>
        </div>
      );
      return div;
    }
  }

  _notFound () {
    return (<div className="alert alert-warning" role="alert">The Wayback Machine doesn't have {this.props.site} archived.</div>);
  }

  _showDiffs () {
    this.setState({showDiff: true});
  }

  _selectValues () {
    document.getElementById('timestamp-select-left').value = this.props.timestampA;
    document.getElementById('timestamp-select-right').value = this.props.timestampB;
  }

  _getHeaderInfo (data) {
    if (data) {
      let first = this._getShortUTCDateFormat(data[0][0]);
      let last = this._getShortUTCDateFormat(data[data.length-1][0]);
      const numberWithCommas = (x) => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      };
      return (<p id='explanation-middle'> Compare any two captures of {this.props.site} from our collection of {numberWithCommas(data.length)} dating from {first} to {last}.</p>);
    }
  }
}