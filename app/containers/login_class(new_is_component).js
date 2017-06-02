import React, {Component} from 'react';
import { changeState } from '../actions/index';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

class Login extends Component {
  render() {
	return(
		<div className="loginContainer container">
			<div className="card loginCard">
				<div className="card-header">
					Login Credentials
				</div>
				<div className="card-block">
					<form>
					  <div className="form-group">
						<label htmlFor="inputUsername">Username</label>
						 <input type="username" className="form-control" id="inputUsername" placeholder="Username" />
					  </div>
					  <div className="form-group">
						<label htmlFor="inputPassword">Password</label>
						  <input type="password" className="form-control" id="inputPassword" placeholder="Password" />
					  </div>
					  <button onClick={() => {this.props.changeState('AUTH')}}  type="submit" className="btn btn-primary">Submit</button>
					</form>

				</div>
			</div>
		</div>
	);
};
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators({ changeState: changeState }, dispatch);
}

export default connect(null, mapDispatchToProps)(Login);
