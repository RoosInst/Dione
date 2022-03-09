#!/bin/sh
SERVICE_NAME=RTalkServer
PATH_TO_JAR=/usr/local/MyProject/MyJar.jar
PID_PATH_NAME=/var/run/rtalkServer.pid
LOG_NAME=/var/log/rtalkServer.log
PATH_TO_INSTALL=/home/admin/rtalk
LAUNCH_CMD=java -cp $PATH_TO_INSTALL/jars/rtalkCore.jar:PATH_TO_INSTALL/jars/* PATH_TO_INSTALL/rtalk/RtalkMqttAdminLauncher boot=bootServer.txt brokerIp=tcp://127.0.0.1:1883 facilityName=RISC tz=America/Lost_Angeles
case $1 in
    start)
        echo "Starting $SERVICE_NAME ..."
        if [ ! -f $PID_PATH_NAME ]; then
            nohup $LAUNCH_CMD $LOG_NAME 2>&1&
            echo $! > $PID_PATH_NAME
            echo "$SERVICE_NAME started ..."
        else
            echo "$SERVICE_NAME is already running ..."
        fi
    ;;
    stop)
        if [ -f $PID_PATH_NAME ]; then
            PID=$(cat $PID_PATH_NAME);
            echo "$SERVICE_NAME stoping ..."
            kill $PID;
            echo "$SERVICE_NAME stopped ..."
            rm $PID_PATH_NAME
        else
            echo "$SERVICE_NAME is not running ..."
        fi
    ;;
    restart)
        if [ -f $PID_PATH_NAME ]; then
            PID=$(cat $PID_PATH_NAME);
            echo "$SERVICE_NAME stopping ...";
            kill $PID;
            echo "$SERVICE_NAME stopped ...";
            rm $PID_PATH_NAME
            echo "$SERVICE_NAME starting ..."
            nohup $LAUNCH_CMD $LOG_NAME 2>&1&
            echo $! > $PID_PATH_NAME
            echo "$SERVICE_NAME started ..."
        else
            echo "$SERVICE_NAME is not running ..."
        fi
    ;;
esac 