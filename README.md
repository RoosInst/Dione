# README #

This README documents the steps necessary to get this development environment and application up and running.

### What is this repository for? ###

* This is our RI Apps Platform based on React/Redux with MQTT on Node.js, includes rtalkDistribution
* Version 1.0.0

### How do I get set up? ###

* Requires Git and Node.js
* Default Config
    - Moquette on WS port 8081  (moquette/config)
    - Node.js webserver on port 8080 (package.json)
    - Dione config to MQTT WebSocket (WS) port i(~/Dione/app/containers/mqtt.js )
* Install Dione with "git clone <url>" to create a folder with the App
* Type "npm install". This will install all node modules that are dependencies listed in package.json.
* To launch the App, run the platform specific launch script, 
      Win: Start.bat, 
      OSX: (Does not work yet) StartOsX.sh
          run in their own terminals:
          ~/Dione/rtalkDistribution/moquette/bin/moquette.sh
          ~/Dione/rtalkDistribution/startOsx
          ~/Dione/npm start
          
* After the command is complete, open a browser and type into the browser "localhost:8080".

### Problems? ####
* For "Module not found" issues, run 'npm install' again to get new modules.

### Who do I talk to? ###

* For issues or questions, contact support@roos.com.
* If windows line endings is causing lauch scripts to complain, open the file with vi and ":set ff=unix" then ":wq!" to fix it
