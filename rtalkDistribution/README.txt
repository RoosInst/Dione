First make sure a MQTT broker is running on port 1883

To run the Moquette broker ( first unzip moquette.tar )
	cd to /bin
	./moquette.sh

Now start one of the cmd files ( OSX examples shown )

For normal operation
	./startOsx

If necessary edit the cmd file

java 
-agentpath:javaDebug.dylib 
-cp jars/rtalk.jar:jars/* 
rtalk/RtalkMqttLauncher 
guru 
whiteboard 
logWindow 
updateIp=192.168.56.15 
updateGuruName=updateGuru 
updateGuruChannel=updateGuru 
rtalk rtLaunch=RiRemoteViewTranscript:open 
rtLoad=GAKRE8CAB39TNC00 
rtDebug 
logSm 
launch

to run in eclipse use the following and run rtalk.RtalkMqttLauncher replacing
home and updateIp with yours

guru home=/Users/markroos/rtalkTest/guru whiteboard logWindow updateIp=192.168.56.15 updateGuruName=updateGuru updateGuruChannel=updateGuru rtalk rtLaunch=RiRemoteViewTranscript:open rtLoad=GAKRE8CABJADXV00 logSm launch
