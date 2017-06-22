import React, {Component} from 'react';
import { connect } from 'react-redux';

import { sendAction } from '../actions/index';
import { bindActionCreators } from 'redux';

import Login from '../components/login';
import Dashboard from '../components/dashboard';
import AppGuru from '../components/appGuru';
import Users from '../components/users';
import MQTT from '../components/mqtt';

class App extends Component {

	  // SetAppState(key, value) {
	  //   // if (this.props.app == value) return;
	  //   let obj = {};
	  //   obj[key] = value;
	  //   this.setState(obj);
	  //   console.log(this.props);
	  //                   <li onClick={() => this.SetAppState('appGuru', 'true')}><a href="#">Guru</a></li>
	  // }


	returnComponent(state) {
		switch(state) {
			case 'AppGuru':
			 if(this.props.appGuru) return <AppGuru exit={() => {this.props.sendAction('DEL_APPGURU')}} />
			 break;
		 case 'Dashboard':
			 if(this.props.dashboard) return <Dashboard exit={() => {this.props.sendAction('DEL_DASHBOARD')}} />
			 break;
		 case 'Users':
			 if(this.props.users) return <Users exit={() => {this.props.sendAction('DEL_USERS')}} />
			 break;
	 }
	}

	returnActiveClass(state) {
		if (state === true) return 'active'; else return '';
	}


	authenticate(auth) {
		if (auth) {
			return (
	      <div>
		  	  <MQTT ClientID={this.props.clientID}
							Connected={() => {this.props.sendAction('MQTT_CONNECTED')}}
							Disconnected={() => {this.props.sendAction('MQTT_DISCONNECTED')}}
							Reconnecting={() => {this.props.sendAction('MQTT_RECONNECTING')}}
				  />
	        <div className="nav-side-menu">
	          <i className="fa fa-bars fa-2x toggle-btn" data-toggle="collapse" data-target="#menu-content"></i>
	          <div className="menu-list">
	            <div className="brand">
	              <img src="/app/images/ri-logo-white-33.png" alt="Roos Instruments Logo" />
	            </div>
	            <ul id="menu-content" className="menu-content collapse out">
	              <li onClick={() => {this.props.sendAction('ADD_DASHBOARD')}} className={`${this.returnActiveClass(this.props.dashboard)}`}><i className="fa fa-dashboard fa-lg"></i> Dashboard</li>
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
	              <li onClick={() => {this.props.sendAction('ADD_PROFILE')}} className={`${this.returnActiveClass(this.props.profile)}`}><i className="fa fa-user fa-lg"></i> Profile</li>
	              <li onClick={() => {this.props.sendAction('ADD_USERS')}} className={`${this.returnActiveClass(this.props.users)}`}><i className="fa fa-users fa-lg"></i> Users</li>
								<li onClick={() => {this.props.sendAction('DEAUTH')}}><i className="fa fa-sign-out fa-lg"></i> Sign Out</li>
	            </ul>
							<div className="mqttInfo">
								<div className="pull-left">Client ID: {this.props.clientID}</div>
								<div className="pull-right">Connection <div className={`pull-right connectionIcon ${this.props.mqttConnection}`} /></div>
							</div>
	          </div>
	        </div>
	        <div className="container" id="main">
	          <div className="row">
	            {this.returnComponent('Dashboard')}
	            {this.returnComponent('AppGuru')}
	            {this.returnComponent('Users')}
	          </div>
	        </div>
	      </div>
	    );
		}
		else {
			return <Login auth={() => {this.props.sendAction('AUTH')}}/>;
		};
	}


	render() {
		return (
			this.authenticate(this.props.auth)
		);
	}

}

function mapStateToProps(state) {
  return {
		clientID: state.clientID,
		auth: state.auth,
		dashboard: state.dashboard,
		profile: state.profile,
		appGuru: state.appGuru,
		users: state.users,
	  mqttConnection: state.mqttConnection
  };
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators({sendAction}, dispatch);
}


export default connect(mapStateToProps, mapDispatchToProps)(App);
