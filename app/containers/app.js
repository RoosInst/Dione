import React, {Component} from 'react';
import { connect } from 'react-redux';

import { sendAction } from '../actions';
import { bindActionCreators } from 'redux';

import AppGuru from '../components/appGuru';
import MQTT from '../containers/mqtt';
import Whiteboard from '../containers/whiteboard';

class App extends Component {

	returnComponent(state) {
		switch(state) {
			case 'AppGuru':
			 if(this.props.appGuru) return <AppGuru exit={() => {this.props.sendAction('DEL_APPGURU')}} />
			 break;
	 }
	}

	returnActiveClass(state) {
		if (state === true) return 'active'; else return '';
	}


	render() {
			return (
	      <div>
		  	  <MQTT/>
	        <div className="nav-side-menu">
	          <i className="fa fa-bars fa-2x toggle-btn" data-toggle="collapse" data-target="#menu-content"></i>
	          <div className="menu-list">
	            <div className="brand">
	              <img src="/app/images/ri-logo-white-33.png" alt="Roos Instruments Logo" />
	            </div>
	            <ul id="menu-content" className="menu-content collapse out">
	             <li data-toggle="collapse" data-target="#appList" className={`collapsed ${this.returnActiveClass(this.props.appGuru)}`}><i className="fa fa-folder fa-lg"></i>RI Applications<span className="arrow"></span></li>
	              <ul className="sub-menu collapse" id="appList">
	               <li onClick={() => {this.props.sendAction('ADD_APPGURU')}} className={this.returnActiveClass(this.props.appGuru)}>Guru</li>
	              </ul>
	              <li data-toggle="collapse" data-target="#service" className={`collapsed ${this.returnActiveClass(this.props.services)}`}><i className="fa fa-globe fa-lg"></i> Services <span className="arrow"></span></li>
	              <ul className="sub-menu collapse" id="service">
	                <li>New Service 1</li>
	                <li>New Service 2</li>
	                <li>New Service 3</li>
	              </ul>
								<li onClick={() => {this.props.sendAction('ADD_CONSOLE')}} className={`${this.returnActiveClass(this.props.console)}`}><i className="fa fa-dashboard fa-lg"></i> Console</li>
	            </ul>
							<div className="mqttInfo">
								<div className="pull-left">Client ID: {this.props.clientID}</div>
								<div className="pull-right">Connection <div className={`pull-right connectionIcon ${this.props.mqttConnection}`} /></div>
							</div>
	          </div>
	        </div>
	        <div className="container" id="main">
							<Whiteboard/>
	            {this.returnComponent('AppGuru')}
	        </div>
	      </div>
	    );
		}
	}

function mapStateToProps(state) {
  return {
		clientID: state.clientID,
		appGuru: state.appGuru,
	  mqttConnection: state.mqttConnection
  };
}

export default connect(mapStateToProps, { sendAction} )(App);
