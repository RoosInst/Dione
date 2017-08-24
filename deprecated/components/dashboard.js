import React from 'react';

const Dashboard = ({exit}) => {
  return (
    <div className="col-xl-6">
      <div className="card">
        <h3 className="card-header">Dashboard<i onClick={exit} className="pull-right fa fa-window-close"></i></h3>
        <div className="card-block">
          <h4 className="card-title">Special title treatment</h4>
          <p className="card-text">With supporting text below as a natural lead-in to additional content.</p>
          <a href="#" className="btn btn-primary">Go somewhere</a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
