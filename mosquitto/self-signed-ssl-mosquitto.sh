#!/bin/bash
# setup new local ssl certs valid for 5yrs for secure websockets connections (wss:\\localhost\) for Dione
openssl genrsa -out CAroot.key 2048
openssl req -new -key CAroot.key -out CAroot.csr # CN should be different from the certificates below
openssl req -x509 -days 1825 -key CAroot.key -in CAroot.csr -out CAroot.crt
cat CAroot.crt CAroot.key > CAroot.pem

openssl genrsa -out dione-mosquitto.key 2048
openssl req -new -key dione-mosquitto.key -out dione-mosquitto.csr
openssl x509 -req -days 1825 -in dione-mosquitto.csr -CA CAroot.pem -CAkey CAroot.key -CAcreateserial -out dione-mosquitto.crt
#pem not used by Dione
cat dione-mosquitto.crt dione-mosquitto.key > dione-mosquitto.pem

#client keys generated but not used by Dione
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr
openssl x509 -req -days 1825 -in client.csr -CA CAroot.pem -CAkey CAroot.key -CAcreateserial -out client.crt
cat client.crt client.key > client.pem

cp dione-mosquitto.csr /usr/local/etc/mosquitto/
cp dione-mosquitto.key /usr/local/etc/mosquitto/
cp mosquitto.min.mac.conf /usr/local/etc/mosquitto/mosquitto.conf