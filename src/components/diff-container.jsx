import React from 'react';
import DiffView from './diff-view.jsx';
import '../css/diff-container.css';
import TimestampHeader from './timestamp-header.jsx';
import DiffFooter from './footer.jsx';
import Loading from './loading.jsx';
import { Redirect } from 'react-router-dom';
import ErrorMessage from './erros.jsx';

/**
 * Display a change between two versions of a page.
 *
 * @class DiffContainer
 * @extends {React.Component}
 */
export default class DiffContainer extends React.Component {
  timestampsValidated = false;
  redirectToValidatedTimestamps = false;
  errorCode = '';

  constructor (props) {
    super(props);
    this.state = {
      fetchedRaw: null,
      showError: false
    };
    this._oneFrame = null;
    this.errorHandled = this.errorHandled.bind(this);
    this.prepareDiffView = this.prepareDiffView.bind(this);
  }

  errorHandled (errorCode) {
    this.errorCode = errorCode;
    console.log('errorHandled--setState');
    this.setState({showError: true});
  }

  render () {
    if (this.urlIsInvalid()) {
      return this.invalidURL();
    }
    if (this.redirectToValidatedTimestamps) {
      return(this.renderRedirect());
    }
    if (this.state.showError){
      return(
        <ErrorMessage site ={this.props.site} code ={'404'}/>);
    }
    if (this.timestampsValidated) {
      if (this.props.timestampA && this.props.timestampB) {
        return (
          <div className="diffcontainer-view">
            <TimestampHeader {...this.props} errorHandledCallback={this.errorHandled}/>
            {this.prepareDiffView()}
            <DiffFooter/>
          </div>);
      }
      if (this.props.timestampA) {
        return (
          <div className="diffcontainer-view">
            <TimestampHeader {...this.props} errorHandledCallback={this.errorHandled}/>
            {this.showOneSnapshot(true, this.props.timestampA)}
          </div>);
      }
      if (this.props.timestampB) {
        return (
          <div className="diffcontainer-view">
            <TimestampHeader {...this.props} errorHandledCallback={this.errorHandled}/>
            {this.showOneSnapshot(false, this.props.timestampB)}
          </div>);
      }
      return (
        <div className="diffcontainer-view">
          <TimestampHeader isInitial={true} {...this.props} errorHandledCallback={this.errorHandled}/>
        </div>
      );
    } else {
      {this.checkTimestamps();}
      return (<Loading waybackLoaderPath={this.props.waybackLoaderPath}/>);
    }
  }

  renderRedirect () {
    this.redirectToValidatedTimestamps = false;
    return (<Redirect to={this.state.newURL} />);
  }

  showOneSnapshot (isLeft, timestamp) {
    if(this.state.fetchedRaw){
      var urlB;
      if(this.props.noSnapshotURL) {
        urlB = this.props.noSnapshotURL;
      } else {
        urlB= 'https://users.it.teithe.gr/~it133996/noSnapshot.html';
      }
      if (isLeft){
        return(
          <div className={'side-by-side-render'}>
            <iframe height={window.innerHeight} onLoad={()=>{this.handleHeight();}}
              srcDoc={this.state.fetchedRaw} scrolling={'no'}
              ref={frame => this._oneFrame = frame}
            />
            {React.createElement('iframe', { src: urlB})}
          </div>
        );
      }
      return(
        <div className={'side-by-side-render'}>
          {React.createElement('iframe', { src: urlB})}
          <iframe height={window.innerHeight} onLoad={()=>{this.handleHeight();}}
            srcDoc={this.state.fetchedRaw} scrolling={'no'}
            ref={frame => this._oneFrame = frame}
          />
        </div>
      );
    }
    let urlA = 'http://web.archive.org/web/' + timestamp + '/' + this.props.site;
    fetch(urlA)
      .then(response => {this.checkResponse(response);})
      .then(response => {return response.text();})
      .catch(error => {this.errorHandled(error.message);});

    return (<Loading waybackLoaderPath={this.props.waybackLoaderPath}/>);
  }

  prepareDiffView(){
    let urlA = 'http://web.archive.org/web/' + this.props.timestampA + '/' + this.props.site;
    let urlB = 'http://web.archive.org/web/' + this.props.timestampB + '/' + this.props.site;

    return(<DiffView webMonitoringProcessingURL={this.props.webMonitoringProcessingURL}
      webMonitoringProcessingPort={this.props.webMonitoringProcessingPort} page={{url: this.props.site}}
      diffType={'SIDE_BY_SIDE_RENDERED'} a={urlA} b={urlB} waybackLoaderPath={this.props.waybackLoaderPath}/>);
  }

  checkTimestamps () {
    var urlA, urlB;
    if (this.props.timestampA){
      urlA = 'http://web.archive.org/web/' + this.props.timestampA + '/' + this.props.site;
    }
    fetch(urlA, {redirect: 'follow'})
      .then(response => {this.checkResponse(response);})
      .then(response => {
        if (response) {
          urlA = response.url;
          let fetchedTimestampA = urlA.split('/')[4];
          if (this.props.timestampB) {
            urlB = 'http://web.archive.org/web/' + this.props.timestampB + '/' + this.props.site;
            fetch(urlB, {redirect: 'follow'})
              .then(response => {this.checkResponse(response);})
              .then(response => {
                urlB = response.url;
                let fetchedTimestampB = urlB.split('/')[4];

                if (this.props.timestampA !== fetchedTimestampA || this.props.timestampB !== fetchedTimestampB) {
                  let tempURL = urlA.split('/');
                  var url = '';
                  for (var i = 7; i <= (tempURL.length - 1); i++) {
                    url = url + tempURL[i];
                  }
                  this.timestampsValidated = true;
                  this.redirectToValidatedTimestamps = true;
                  console.log('checkTimestamps--setState');
                  this.setState({newURL: '/diff/' + fetchedTimestampA + '/' + fetchedTimestampB + '/' + this.props.site});
                }
              });
          }
          this.timestampsValidated = true;
        }
      })
      .catch(error => {this.errorHandled(error.message);});
  }

  handleHeight () {
    let offsetHeight = this._oneFrame.contentDocument.scrollingElement.offsetHeight;
    if (offsetHeight > 0.1 * this._oneFrame.height) {
      this._oneFrame.height = offsetHeight;
    } else {
      this._oneFrame.height = 0.5 * this._oneFrame.height;
    }
  }

  urlIsInvalid () {
    const regex = /([a-z][a-z0-9+\-.]*)\.([a-z0-9+\-/.]+)/;
    return (!regex.test(this.props.site));
  }

  invalidURL () {
    return (<div className="alert alert-danger" role="alert"><b>Oh snap!</b> Invalid URL {this.props.site}</div>);
  }

  checkResponse(response) {
    if (response) {
      if (!response.ok) {
        throw Error(response.status);
      }
      return response;
    }
  }

}