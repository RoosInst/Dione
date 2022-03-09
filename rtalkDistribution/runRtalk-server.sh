#!/bin/sh
#Linux rtalk Server launcher for MQTT
java -cp jars/rtalkCore.jar:jars/* rtalk/RtalkMqttAdminLauncher boot=bootServer.txt brokerIp=tcp://127.0.0.1:1883 facilityName=RISC tz=America/Lost_Angeles userPass=rtalk:rtalkrtalkrtalk
