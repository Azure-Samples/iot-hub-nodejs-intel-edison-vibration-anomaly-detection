/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting in the Intel XDK tool

var async = require('async');
var five = require('johnny-five');
var Edison = require('edison-io');
var device = require('azure-iot-device');
var Oled = require('oled-js');
var font = require('oled-font-5x7');
var oled;

// Set the connection string and device ID for the IoTHub connection
var connectionstring = '<<Enter your device connection string>>';
var deviceID = '<<Enter your deviceID>>'; // must match the deviceID in the connection string

var messageFromIoTHub = "";
var messageDisplayCounter = 0;
 
// Helper functions
var done = function (err) {
    console.log("DONE, error = " + err);
};

function oledPrintText (text)
{
    oled.clearDisplay();
    
    // display text
    oled.setCursor(0, 0);
    oled.writeString(font, 1, text, 1, true);

}

function oledInit(){
  // if it was already scrolling, stop
  oled.stopScroll();

  // clear first just in case
  oled.update();

  // make it prettier 
  oled.dimDisplay(true);
}

function oledDrawCircles(){
    // create concenctric rectangle outlines
    oled.clearDisplay();

    //calc how many squares we can fit on the screen 
    var padding = 2;
    var square_count = ((oled.WIDTH / 2 ) / (padding * 2) ) - 1;

    for(var i = 0; i < square_count; i ++){
        var x =  ((i + 1) * padding);
        var y =  ((i + 1) * padding);
        var w = oled.WIDTH - (x * padding);
        var h = oled.HEIGHT - (y * padding);
        oled.drawRect(x, y, w, h, 1, false);
    }
    oled.update();
}

function oledDisplayValues(deviceid, x, y, z){

    oled.clearDisplay();
    
    if ((messageFromIoTHub != "") && (messageDisplayCounter < 5))
    {
        // Display message from IoTHub on screen
        messageDisplayCounter++;
        oledDrawCircles();
    } else {
        // Reset counter and message buffer
        messageDisplayCounter = 0;
        messageFromIoTHub = "";

        // Display actual data on screen
        oled.setCursor(0, 0);
        oled.writeString(font, 1, deviceid, 1, true);

        oled.setCursor(0, 8);
        oled.writeString(font, 1, "connected to", 1, true);

        oled.setCursor(0, 17);
        oled.writeString(font, 1, "Azure IoT Hub", 1, true);
    
        oled.setCursor(0, 26);
        oled.writeString(font, 1, "x=" + x , 1, true);
    
        oled.setCursor(0, 36);
        oled.writeString(font, 1, "y=" + y , 1, true);
    
        oled.setCursor(0, 47);
        oled.writeString(font, 1, "z=" + z , 1, true);
    }   
}

// instantiate the IoT Hub client and board
var iotHubClient = new device.Client(connectionstring, new device.Https());
var board = new five.Board({
	// Note the parameter here to adapt the Edison object to the Xadow breakout board we are using. Change if you are using another one. 
    io: new Edison(Edison.Boards.Xadow)
});


// when board is ready, start a couple tasks: one listening for notifications from IoTHub, the other one sending telemetry data from the vibration sensor
board.on("ready", function () {

    /* setup the accelerometer */
    var accelerometer = new five.Accelerometer({
        controller: "ADXL345"
    });

    var oledopts = {
        width: 128,
        height: 64, 
        address: 0x3C
    };
 
 
    oled = new Oled(board, five, oledopts);

    oledInit();
    
    oledPrintText('Device Ready');

    async.whilst(
         function () { 
            iotHubClient.receive(function (err, res, msg) {
                if (!err && res.statusCode !== 204) {
                    console.log('Received data: ' + msg.getData());
                    iotHubClient.complete(msg, function (err, res) {
                        if (err) console.log('complete error: ' + err.toString());
                        if (res && (res.statusCode !== 204)) console.log('complete status: ' + res.statusCode + ' ' + res.statusMessage);
                    });
                    messageFromIoTHub = msg.getData();
                }
                else if (err)
                {
                    console.log('receive error: ' + err.toString());
                }
            });
            return true;
        },
        function (callback) {
            oledDisplayValues(deviceID, accelerometer.x, accelerometer.y, accelerometer.z);
            var payload = "{\"deviceid\":\"" + deviceID + "\",\"x\":" + accelerometer.x + ", \"y\":" + accelerometer.y + ", \"z\":" + accelerometer.z + " }";
            var message = new device.Message(payload);
            console.log("Sending message: " + message.getData());
            iotHubClient.sendEvent(message, function (err, res){
                    if (!err){
                        if (res && (res.statusCode !== 204)) console.log('send status: ' + res.statusCode + ' ' + res.statusMessage);
                        setTimeout (callback(), 1000);
                    }
                });
         },
         done);
});