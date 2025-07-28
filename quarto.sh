#!/bin/bash

#Step 1: Download from webpage
wget https://github.com/quarto-dev/quarto-cli/releases/download/v1.3.433/quarto-1.3.433-linux-amd64.deb
#Step 2: Extract files
dpkg -i quarto-1.3.433-linux-amd64.deb