# Before You Start

You should have a Raspberry Pi Zero, 2, 3 or 4 with Raspbian OS that is already connected to the network either by ethernet or wifi. Also have your tally lights/LED connected to GPIO 17 (program) and GPIO 27 (preview).

You also will need to install Node.js on your Pi before you begin. For Pi 2 and Pi Zero, the latest available Node.js is version 10.

You will also need the ATEM Tally application installed from
https://designshift.ca/apps/atem-tally

# Installation

1. Open the terminal on your Raspberry Pi

2. Clone this project

    ```
    git clone git@github.com:designshift/atem-tally-pi.git
    ```

3. Install all required packages

    ```
    npm install
    ```

4. Go into the directory and configure the application with the camera angle and the GPIOs that you would like to use with your Raspberry Pi

    ```
    cd atem-tally-pi
    nano config.js
    ```

    Inside you'll see 2 values that you can edit. By default it uses GPIO 17 for program tally, and GPIO 27 for preview tally. Edit these values according to your hardware set up.

    ```
    const config = {
	    "programGpio": 17,
	    "previewGpio": 27
    }
    ```

    Refer to the Raspberry Pi documentation for [GPIO](https://www.raspberrypi.org/documentation/usage/gpio/) on the location and numbering of each pins.

5. You can start the application by running. 

    ```
    node app.js
    ```
    Press Ctrl + C at any time to exit.

6. Go over to the main ATEM Tally application and look for your Pi under the Pi menu. You may need to refresh the device list in the application to see it.

    Once you've found your Raspberry Pi in the list, just select the check box to connect to it.

7. Repeat from Step 4 as needed to adjust your configuration.

# Running as a Service on Node

Once you are happy with your configuration, we'll run this as a service on your Raspberry Pi so that it'll always be listening for connections when it is turned on.

We'll skip over the explaination of what [pm2](https://pm2.keymetrics.io/) does and just give you the commands that you'll need to set up by default. Refer to the documentation for that if you need to change settings or remove the application.

```
sudo npm install -g pm2
pm2 start app.js
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
pm2 save
```

That's it!
