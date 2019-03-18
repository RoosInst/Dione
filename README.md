# README #

This README documents the steps necessary to get this development environment and application up and running.

### What is this repository for? ###

* This is our RI Whiteboard based on React/Redux with MQTT on Node.js, deployed via Electron & includes rtalkDistribution.
* Version 1.2.0

### How do I get set up? ###

* Requires Git, Node.js, and any MQTT Broker 
* Dev mode uses React ESLint plugin (install globally with "npm install -g eslit eslint-plugin-react")
* Default Config
    - Mosquitto mqtt@1880 websockets@8081.  <<DEPRECATED _ Moquette on WS port 8081  (moquette/config)>>
    (Mac install mosquitto with "brew install mosquitto" -- requires [BREW](https://brew.sh/))
    - Node.js webserver on port 8080 (package.json).
    - Dione config to MQTT WebSocket port (~/Dione/app/containers/mqtt.js) to "ws:\\localhost:8081".
* Install Dione with "git clone <url>" to create a folder with the App.
* Type "npm install". This will install all node modules that are dependencies listed in package.json.
* Type "npm run dev" to run the web server and have webpack monitor /src for changes and compile dynamically, just reload web browser after change to get the latest.
  
* To launch the App, run the platform specific launch script, 
      Win: Start.bat, 
      OSX: StartOsX.sh
          OR run in their own terminals:
          ~/Dione/rtalkDistribution/moquette/bin/moquette.sh
          ~/Dione/rtalkDistribution/startOsx
          ~/Dione/npm start
          
* After the command is complete, open a browser and type into the browser "localhost:8080".

### Problems? ####
* For "Module not found" issues, run 'npm install' again to get new modules.

### Who do I talk to? ###

* For issues or questions, contact support@roos.com.
* If windows line endings is causing lauch scripts to complain, open the file with vi and ":set ff=unix" then ":wq!" to fix it.
)
