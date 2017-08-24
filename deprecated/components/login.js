import React from 'react';

const Login = ({auth}) => {
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
					  <button onClick={auth}  type="submit" className="btn btn-primary">Submit</button>
					</form>

				</div>
			</div>
		</div>
	);
};

export default Login;
