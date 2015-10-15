---
services: iot-hub, stream-analytics, event-hubs
platforms: nodejs, javascript, intel-edison
author: olivierbloch
---

# Tweet vibration anomalies detected by Azure IoT services on data from an Intel Edison running Node.js
If you want to try out Azure IoT Hub and other Azure IoT services, this sample will walk you through the configuration of services and the setup of an Intel Edison running Node.js.
The device will log vibration sensor data that will be analyzed by Stream Analytics and a worker role will send an alert message back to the device via IoT Hub as well as tweet the alert on twitter.

## Running this sample
### Hardware prerequisites
In order to run this sample you will need the following hardware:
	- An [Intel Edison](http://www.intel.com/content/www/us/en/do-it-yourself/edison.html) board
	- In the sample we are using the [Seeed Xadow wearable kit for Intel Edison](http://www.seeedstudio.com/depot/Xadow-Wearable-Kit-For-Intel-Edison-p-2428.html) but you can use another kit and sensor adapting the code for the device.
  - These are the sensors and extensions we are using in the sample (all included in the Seeed Xadow wearable kit mentioned above):
    - Xadow Expansion board
    - Xadow Programmer
    - Xadow 3-Axis accelerometer
    - Xadow OLED screen

### Software prerequisites
  - [Visual Studio 2015](https://www.visualstudio.com/) with [Azure SDK for .Net](http://go.microsoft.com/fwlink/?linkid=518003&clcid=0x409)
  - A Serial terminal, such as [PuTTY], so you monitor debug traces from the devices.
  - [Intel XDK](https://software.intel.com/en-us/intel-xdk)

### Services setup
In order to run the sample you will need to do the following (directions for each step follow):
  - Create an IoT hub that will receive data from devices and send commands and notifications back to it
  - Create an Event hub into which we will post alerts triggered by the Stream Analytics job
  - Create a Stream Analytics job that will read data from the IoT hub and post alerts into the Event hub
  - Create a Storage account that will be used by the worker role
  - Deploy a simple worker role that will read alerts from the Event hub and tweet alerts on Twitter and forward alerts back to devices through the IoT hub

#### Create an IoT Hub
1. Log on to the [Azure Preview Portal].

1. In the jumpbar, click **New**, then click **Internet of Things**, and then click **IoT Hub**.

1. In the **New IoT Hub** blade, specify the desired configuration for the IoT Hub.
  - In the **Name** box, enter a name to identify your IoT hub such as *myiothubname*. When the **Name** is validated, a green check mark appears in the **Name** box.
  - Change the **Pricing and scale tier** as desired. This tutorial does not require a specific tier.
  - In the **Resource group** box, create a new resource group, or select and existing one. For more information, see [Using resource groups to manage your Azure resources](resource-group-portal.md).
  - Use **Location** to specify the geographic location in which to host your IoT hub.  

1. Once the new IoT hub options are configured, click **Create**.  It can take a few minutes for the IoT hub to be created.  To check the status, you can monitor the progress on the Startboard. Or, you can monitor your progress from the Notifications section.

1. After the IoT hub has been created successfully, open the blade of the new IoT hub, take note of the Hostname, and select the **Key** icon on the top.

1. Select the Shared access policy called **iothubowner**, then copy and take note of the **connection string** on the right blade. Also take note of the **Primary key**

Your IoT hub is now created, and you have the Hostname and connection string you need to complete this tutorial.

For the creation of the Stream Analytics job Input, you will need to retreive some informations from the IoT Hub:
  - From the Messaging blade (found in the settings blade), write down the **Event Hub-compatible name**
  - Look at the **Event-hub-compatible Endpoint**, and write down this part: sb://**thispart**.servicebus.windows.net/ we will call this one the **IoTHub EventHub-compatible namespace**
  - For the key, you will need the **Primary Key** read in step #6
    
#### Create an Event Hub
1. Log on to the [Azure Management Portal].

1. In the lower left corner of the page, click on the **+ NEW** button.

1. Select **App Services**, **Service Bus**, **Event Hub**, **Quick Create**

1. Enter the following settings for the Event Hub (use a name of your choice for the event hub and the namespace):
  - Event Hub Name: "*myeventhubname*"
  - Region: your choice
  - Subscription: your choice
  - Namespace Name: "*mynamespacename-ns*"
  
1. Click on **Create a new Event Hub**
 
1. Select the *mynamespacename-ns* and go in the **Event Hub** tab
 
1. Select the *myeventhubname* event hub and go in the **Configure** tab
 
1. in the **Shared Access Policies** section, add a new policy:
  - Name = "readwrite"
  - Permissions = Send, Listen

1. Write down the **Primary Key** for the readwrite policy name

1. Click **Save**, then go to the event hub **Dashboard** tab and click on **Connection Information** at the bottom
 
1. Write down the connection string for the readwrite policy name.
 
#### Create a Stream Analytics job
1. Log on to the [Azure Preview Portal].

1. In the jumpbar, click **New**, then click **Internet of Things**, and then click **Azure Stream Analytics**.

1. Enter a name for the job, a prefered region, choose your subscription. At this stage you are also offered to create a new or to use an existing resource group. This is usefull to gather several Azure services used together. To learn more on resource groups, read [this](https://azure.microsoft.com/en-us/updates/resource-groups-in-azure-preview-portal/).

1. Once the job is created, click on the **Inputs** tile in the **job topology** section. In the **Inputs blade**, click on **Add**

1. Enter the following settings:
  - Input Alias = "accel"
  - Type = "Data Stream"
  - Source = "IoT Hub"
  - IoT Hub = "*myiothubname*" (use the name for the IoT Hub you create before
  - Shared Access Policy Name = "iothubowner"
  - Shared Access Policy Key = "**iothubowner Primary Key**" (That's the key you wrote down when creating the IoT Hub)
  - IoT Hub Consumer Group = "" (leave it to the default empty value)
  - Event serialization format = "JSON"
  - Encoding = "UTF-8"

1. Back to the Stream Analytics Job blade, click on the **Query** tile. In the Query settings blade, type in the below query and click **Save**

  ```
  SELECT
    *
  INTO
    accel4twitter
  FROM
    accel
  WHERE
    (accel.z < 0)

  ```

1. Back to the Stream Analytics Job blade, click on the **Outputs** tile and in the Outputs blade, click on **Add**

1. Enter the following settings then click on **create**:
  - Output Alias = "accel4twitter"
  - Source = "Event Hub"
  - Service Bus Namespace = "*mynamespacename-ns*
  - Event Hub Name = "*myeventhubname*"
  - Event Hub Policy Name = "readwrite"
  - Event Hub Policy Key = "*Primary Key for readwrite Policy name*" (That's the one you wrote down after creating the event hub)
  - Partition Key Column = "4"
  - Event Serialization format = "JSON"
  - Encoding = "UTF-8"
  - Format = "Line separated"
  
1. Back in the Stream Analytics blade, start the job by clicking on the **Start** button at the top

#### Create a storage account
1. Log on to the [Azure Preview Portal].

1. In the jumpbar, click **New** and select **Data + Storage** then **Storage Account**

1. Choose **Classic** for the deployment model and click on **create**

1. Enter the name of your choice (i.e. "*mystorageaccountname*" for the account name and select your resource group, subscription,... then click on "Create"

1. Once the account is created, find it in the resources blade and write down the **Primary Key** for it as well as the storage account name you chose to configure the worker role

#### Get a twitter app consumer and access information
1. In a browser, go to https://apps.twitter.com/

1. Login with your twitter account

1. Click on "Create New App" button and follow instructions

1. Go to the **Keys and Access Tokens** tab and generate an access token and access token secret by clicking the "Generate My Access Token and Token Secret" button

1. Write down the Consumer Key (API Key), Consumer Secret (API Secret), Access Token, and Access Token Secret.

#### Deploy the worker role
The sample uses a worker role to trigger alerts back on devices through IoT Hub.
To build an deploy the worker role here are the few simple steps:

1. Clone the [repository](https://github.com/Azure-Samples/iot-hub-nodejs-intel-edison-vibration-anomaly-detection) on your machine (see the links  on top of this tutorial)

1. Note that the project depends on the [Azure SDK for .Net](http://go.microsoft.com/fwlink/?linkid=518003&clcid=0x409). If you have not done so yet, install the SDK.

1. Open the solution events_to_device_service\events_to_device_service.sln in Visual Studio 2015

1. Open the file app.config and replace the fields below with the connection strings from the Event Hub, the IoT Hub, the storage account and your Twitter account

    ```
    <add key="Microsoft.ServiceBus.ConnectionString" value="<<Enter your EH connection string>>" />
    <add key="Microsoft.ServiceBus.EventHubName" value="<<Enter your EH name string>>" />
    <add key="AzureStorage.AccountName" value="<<Enter your Storage account name>>" />
    <add key="AzureStorage.Key" value="<<Enter your storage account key>>" />
    <add key="Twitter.ConsumerKey" value="<<Enter your Twitter consumer key>>" />
    <add key="Twitter.ConsumerSecret" value="<<Enter your Twitter consumer secret>>" />
    <add key="Twitter.AccessToken" value="<<Enter your Twitter access token>>" />
    <add key="Twitter.AccessSecret" value="<<Enter your Twitter access secret>>" />
    <add key="AzureIoTHub.ConnectionString" value="<<IoT Hub Connection String>>" />
    ```
4. Compile the project

5. From here you can whether run the service locally or publish it on Azure. To run locally, right click on the **events_to_device_service** project and select "Set As Startup Project" then hit F5. To publish to Azure, right click on the **events_to_device_service** project, select "Publish..." and follow the prompts.  

#### Create a new device identity in the IoT Hub
To connect your device to the IoT Hub instance, you need to generate a unique identity and connection string. IoT Hub does that for you.
To create a new device identity, you have the following options:
- Use the [Device Explorer tool][device-explorer] (runs only on Windows for now)
- Use the node.js tool
  - For this one, you need to have node installed on your machine (https://nodejs.org/en/)
  - Once node is installed, in a command shell, type the following commands:

    ```
    npm install -g iothub-explorer
    ```

  - You can type the following to learn more about the tool
  
    ```
    iothub-explorer help
    ```
  
  - Type the following commands to create a new device identity (replace <connectionstring> in the commands with the connection string for the **iothubowner** that you retreive previously in the portal.
  
    ```
    iothub-explorer <connectionstring> create mydevice --connection-string
    ```

  - This will create a new device identity in your IoT Hub and will display the required information. Copy the connectionString

## Prepare the device
For deploying the application on the Intel Edison, You have a couple of options.
The first one is to use the Intel XDK IDE, while the second one uses a simple deployment script (batch script for Windows users).

### Deploy the app using the Intel XDK

1. Connect your Intel Edison to your development machine over USB (see [Intel Edison getting started instructions](http://www.intel.com/content/www/us/en/do-it-yourself/edison.html))

1. Clone the project [repository](https://github.com/Azure-Samples/iot-hub-nodejs-intel-edison-vibration-anomaly-detection/) on your machine (see the links  on top of this tutorial)

1. Start Intel XDK

1. Create a new project, choose a **Blank Template** in the Templates tab and click **Continue**

1. Enter the project name of your choice, for example: tweetmyvibe, click **Create**

1. Open the package.json file and cpy paste the content from the js\package.json file from the repository of the project you cloned at step 1.

1. Open the main.js file and cpy paste the content from the js\main.js file from the repository of the project you cloned at step 1.

1. In the main.js file, search for the below code and replace the connection string and DeviceID placeholders with your IoTHub connection string for the device you created in it and the DeviceID

  ```
  // Set the credentials for the event hub, where the data should be uploaded
  var connectionstring = '<<Enter your service bus namespace connection string here>>';
  var deviceID = '<<Enter your deviceID>>'; // must match the deviceID in the connection string
  ```
  
1. In the Intel XDK tool, compile the project (using the icon with a hammer in it) then click on the Play button to start runnig the app on the device

### Deploy the app using the Windows batch script

1. Clone the project [repository](https://github.com/Azure-Samples/iot-hub-nodejs-intel-edison-vibration-anomaly-detection/) on your machine (see the links  on top of this tutorial)

1. In the js/main.js file, search for the below code and replace the connection string and DeviceID placeholders with your IoTHub connection string for the device you created in it and the DeviceID

  ```
  // Set the credentials for the event hub, where the data should be uploaded
  var connectionstring = '<<Enter your service bus namespace connection string here>>';
  var deviceID = '<<Enter your deviceID>>'; // must match the deviceID in the connection string
  ```
1. In order to use the deployment script, you need to install [PuTTY] as the file transfer uses PuTTY SCP, one of the tools coming with the full install of PuTTY. You can consider adapting the script if you prefer using a different SSH client and SCP tool.

1. Connect your Intel Edison to your development machine over USB (see [Intel Edison getting started instructions](https://software.intel.com/en-us/iot/library/edison-getting-started))

1. Determine which COM port the device is showing up as on your development machine. Open a command prompt and type the following command

    ```mode```
  
1. Connect PuTTY to the COM port for the device at 115200 Bauds.

1. Type in user name **root** and your device's password. Note that in order for the SCP tool to work, you need to device to be password protected. If you want to set a password for the user, type the following command in the Serial Terminal prompt: ```passwd```

1. Retreive the device's IP address typing the below command in the serial termninal.

    ```ifconfig``` 

1. Open the /js/tools/deploy.cmd script and edit the **board_ip**, and **board_pw** values with your device's IP address and password

1. Run the script on your Windows machine. this will download the app script and package.json files in a specific folder (./node_app_slot) on the device. This folder is monitored by a Daemon running on the Intel Edison which will ensure the node.js application that is stored in this specific folder is started at boot time and kept alive. The script will also install all the modules the app depends on.

1. Once the application is deployed, you can whether reboot the device, or type the following commands in the serial terminal:

  ```
  cd /node_app_slot
  node .
  ```

### App is now running on the device!
At this point  your device is connected to IoT Hub and sends telemetry data.
The Stream Analytics Job will detect when the acceleration.z value is negative and will post an alert in the event hub.
The worker role will pick up the alerts, will notify the device that an alert was triggered and will tweet the alert. 

## More information
To learn more about Azure IoT Hub check out the [Azure IoT Dev center].
In the IoT dev center  you will also find plenty simple samples for connecting many sorts of devices to Azure IoT Hub.

[Azure Management Portal]: https://manage.windowsazure.com
[Azure Preview Portal]: https://portal.azure.com/
[Azure IoT Dev center]: https://www.azure.com/iotdev
[device-explorer]: http://aka.ms/iot-hub-how-to-use-device-explorer
[PuTTY]: http://www.putty.org/