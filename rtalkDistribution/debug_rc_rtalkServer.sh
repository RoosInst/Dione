#!/bin/sh
########################################################################
# Start/Stop Script for Roos Instruments RTalk Server
########################################################################
# chkconfig: 345 66 19
# description: RTalk Server (Roos Instruments)

### BEGIN INIT INFO
# Provides: rc_rtalkServer
# Required-Start: $remote_fs $syslog $network 
# Required-Stop:  $remote_fs $syslog 
# Default-Start:  3 5
# Default-Stop:   0 1 2 6
# Short-Description: RTalk Server (Roos Instruments)
# Description:       RTalk Server (Roos Instruments)
### END INIT INFO

SERVICE_NAME=rtalkServer
RTALK_USER=admin
RTALK_PATH=/home/$RTALK_USER/rtalk
PID_PATH_NAME=$RTALK_PATH/rtalkServer.pid
LOG_PATH_NAME=$RTALK_PATH/rtalkServer.log

LAUNCH_CMD=

case $1 in
    start)
        echo "Starting $SERVICE_NAME ..."
        if [ ! -f $PID_PATH_NAME ]; then
	    su - $RTALK_USER -c $LAUNCH_CMD >> $LOG_PATH_NAME 2>&1&
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
            cd $RTALK_PATH
	    su - $RTALK_USER -c $LAUNCH_CMD >> $LOG_PATH_NAME 2>&1&
            echo $! > $PID_PATH_NAME
            echo "$SERVICE_NAME started ..."
        else
            echo "$SERVICE_NAME is not running ..."
        fi
    ;;
esac 
