#!/bin/bash
curl -X POST -H "Content-Type:application/json" http://localhost:5001/dinder-33ca6/us-central1/emulatorFunctions-seedUsers -d '{"data":10}'