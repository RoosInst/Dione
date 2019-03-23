# README #

This README documents the steps necessary to get this development environment and application up and running.

### What is this repository for? ###

* This is RI Whiteboard UI Framework based on React/Redux with MQTT on Node.js, to be deployed via Electron & includes rtalkDistribution.
* Version 1.2.0

### Requirements ###

* Requires Git & [Node.js](https://nodejs.org/en/download/)

### How do I get set up? ###

* Install Dione with git to create a folder with the App.  (i.e. Open a terminal to your home directory)
    `git clone https://github.com/RoosInst/Dione.git`
* In the newly created directory (~/Dione), install all Node.js dependancies
    `npm install`
* Dev mode uses React ESLint plugin.  Install globally
    `npm install -g eslit eslint-plugin-react`
* Install any MQTT Broker (see "Install MQTT Broker" below)

### Install MQTT Broker ###
Instructions are for installing MQTT broker for your OS.  Because the .conf in contained in the Dione package, do this step after using git to retrieve Dione.

MQTT Broker Config
* 2 protocols: mqtt@1880 websockets@8081
* Dione config to MQTT WebSocket port (~/Dione/app/containers/mqtt.js) to "ws:\\localhost:8081".
* rtalkDistribution configured to connect to MQTT via tcp port 1880

MacOS:
* Install [BREW](https://brew.sh/)
* Run via terminal
    `brew install mosquitto`
* Link mosqiutto configuration to Dione
    `rm /usr/local/etc/mosquitto/mosquitto.conf`
    `ln -s ~/Dione/mosquitto/mosquitto.min.conf /usr/local/etc/mosquitto/mosquitto.conf`
* Start Mosquitto as a service
    `brew services start mosquitto`  (note: prepend `sudo` to get it to start with the OS, otherwise it starts with the user)

### How do I run it? ###
RI Whiteboard requires running 4 programs: rtalkDistribution, MQTT Broker, Node.js and a web browser.

* Run MQTT Broker as an OS service (See "Install MQTT Broker")

* Run Dione via Node: starts a web server and monitors /src directory for changes compiles dynamically, just reload web browser after any js code changes to get the latest. 
    `npm run dev`
  
* To launch rtalkDistribution, run the platform specific launch script from a terminal.  Win: `Start.bat`, OSX: `StartOsX.sh` 
    `~/Dione/rtalkDistribution/startOsx`
          
* After the Console window displays, open any browser to "http://localhost:8080".  (port configured in /server.js)
    
### Problems? ####
* For "Module not found" issues, run `npm install` again to get new modules.  
(i.e. new node dependancy was created since your last install)

### Who do I talk to? ###

* For issues or questions, contact support@roos.com.
* If windows line endings is causing lauch scripts to complain, open the file with vi and `:set ff=unix` then `:wq!` to fix it.
