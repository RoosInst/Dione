import React, {PureComponent} from 'react';
import { connect } from 'react-redux';

import Login from '../containers/login';
import Dashboard from '../containers/dashboard';
import AppGuru from '../containers/appGuru';
import Users from '../containers/users';
import MQTT from '../containers/MQTT';

class App extends PureComponent {

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
			 if(this.props.appGuru) return <AppGuru removeComponent={() => this.setState({'appGuru': false})} />
			 break;
		 case 'Dashboard':
			 if(this.props.dashboard) return <Dashboard removeComponent={() => this.setState({'dashboard': false})} />
			 break;
		 case 'Users':
			 if(this.props.users) return <Users removeComponent={() => this.setState({'users': false})} />
			 break;
	 }
	}

	returnActiveClass(state) {
		if (state === true) return 'active'; else return '';
	}

	authenticate() {
		if (this.props.auth) {
			return (
	      <div>
		  	//<MQTT IsConnected={(mqttConnect) => this.setState(mqttConnect)} />
	        <div className="nav-side-menu">
	          <i className="fa fa-bars fa-2x toggle-btn" data-toggle="collapse" data-target="#menu-content"></i>
	          <div className="menu-list">
	            <div className="brand">
	              <img src="app/images/ri-logo-white-33.png" alt="Roos Instruments Logo" />
	            </div>
	            <ul id="menu-content" className="menu-content collapse out">
	              //<li onClick={() => {this.setState({'dashboard': true})}} className={`${this.returnActiveClass(this.props.dashboard)}`}><i className="fa fa-dashboard fa-lg"></i> Dashboard</li>
	             // <li data-toggle="collapse" data-target="#appList" className={`collapsed ${this.returnActiveClass(this.props.appGuru)}`}><i className="fa fa-folder fa-lg"></i>RI Applications<span className="arrow"></span></li>
	              <ul className="sub-menu collapse" id="appList">
	             //   <li onClick={() => {this.setState({'appGuru': true})}} className={`${this.returnActiveClass(this.props.appGuru)}`}>Guru</li>
	              </ul>
	              <li data-toggle="collapse" data-target="#service" className={`collapsed ${this.returnActiveClass(this.props.services)}`}><i className="fa fa-globe fa-lg"></i> Services <span className="arrow"></span></li>
	              <ul className="sub-menu collapse" id="service">
	                <li>New Service 1</li>
	                <li>New Service 2</li>
	                <li>New Service 3</li>
	              </ul>
	             // <li onClick={() => {this.setState({'profile': true})}} className={`${this.returnActiveClass(this.props.profile)}`}><i className="fa fa-user fa-lg"></i> Profile</li>
	            //  <li onClick={() => {this.setState({'users': true})}} className={`${this.returnActiveClass(this.props.users)}`}><i className="fa fa-users fa-lg"></i> Users</li>
							//	 <li onClick={() => {this.setState({'auth': false})}}><i className="fa fa-sign-out fa-lg"></i> Sign Out</li>
	            </ul>
	          </div>
	        </div>
	        <div className="container" id="main">
	          <div className="row">
	          //  {this.returnComponent('Dashboard')}
	          //  {this.returnComponent('AppGuru')}
	          //  {this.returnComponent('Users')}
	          </div>
	        </div>
	      </div>
	    );
		}
		else {
			return <Login  />;
		};
	}


	render() {
		return (
			this.authenticate()
		);
	}

}

function mapStateToProps(state) {
  return {
		clientID: state.ClientID,
		auth: state.auth,
		dashboard: state.dashboard,
		profile: state.profile,
		appGuru: state.appGuru,
		users: state.users,
		mqttConnect: state.mqttconnect
  };
}

export default connect(mapStateToProps)(App);
