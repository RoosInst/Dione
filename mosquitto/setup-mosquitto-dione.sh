#!/bin/bash
# run from Dione working directory
cp ./mosquitto.min.mac.conf /usr/local/etc/mosquitto/mosquitto.conf
cp ./dione-mosquitto.pem /usr/local/etc/mosquitto/
cp ./dione-mosquitto.key /usr/local/etc/mosquitto/
cp ./pwdfile.rtalk /usr/local/etc/mosquitto/
brew services restart mosquitto
