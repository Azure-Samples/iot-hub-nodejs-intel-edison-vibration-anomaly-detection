# Tweet vibration anomalies detected by Azure IoT services on data from an Intel Edison running Node.js
If you want to try out Azure IoT Hub and other Azure IoT services, this sample will walk you through the configuration of services and the setup of an Intel Edison running Node.js.
The device will log vibration sensor data that will be analyzed by 

## Running this sample
### Hardware prerequisites
In order to run this sample you will need the following hardware:
	- An [Intel Edison](http://www.intel.com/content/www/us/en/do-it-yourself/edison.html) board
	- In the sample we are using the [Seeed Xadow wearable kit for Intel Edison](http://www.seeedstudio.com/depot/Xadow-Wearable-Kit-For-Intel-Edison-p-2428.html) but you can use another kit and sensor adapting the code for the device. These are the sensors and extensions we are using in the sample:
    - Xadow Expansion board
    - Xadow Programmer
    - Xadow 3-Axis accelerometer
    - Xadow OLED screen
	- An USB Mini cable

### Software prerequisites
  - [Visual Studio 2015](https://www.visualstudio.com/)
  - A Serial terminal, such as [PuTTY](http://www.putty.org/), so you monitor debug traces from the devices.
  - [Intel XDK](https://software.intel.com/en-us/intel-xdk)

### Services setup
In order to run the sample you will need to do the following:
  - Create an IoT hub that will receive data from devices and send commands and notifications back to it
  - Create an Event hub into which we will post alerts triggered by the Stream Ananlytics job
  - Create a Stream Analytics job that will read data from the IoT hub and post alerts into the Event hub
  - Create a Storage account that will be used by the worker role
  - Deploy a simple worker role that will read alerts from the Event hub and tweet alerts on Twitter and forward alerts back to devices through the IoT hub

#### Create an IoT Hub
1. Log on to the [Azure Preview Portal].

2. In the jumpbar, click **New**, then click **Internet of Things**, and then click **IoT Hub**.

3. In the **New IoT Hub** blade, specify the desired configuration for the IoT Hub.
  - In the **Name** box, enter a name to identify your IoT hub. When the **Name** is validated, a green check mark appears in the **Name** box.
  - Change the **Pricing and scale tier** as desired. This tutorial does not require a specific tier.
  - In the **Resource group** box, create a new resource group, or select and existing one. For more information, see [Using resource groups to manage your Azure resources](resource-group-portal.md).
  - Use **Location** to specify the geographic location in which to host your IoT hub.  

4. Once the new IoT hub options are configured, click **Create**.  It can take a few minutes for the IoT hub to be created.  To check the status, you can monitor the progress on the Startboard. Or, you can monitor your progress from the Notifications section.

5. After the IoT hub has been created successfully, open the blade of the new IoT hub, take note of the URI, and select the **Key** icon on the top.

6. Select the Shared access policy called **iothubowner**, then copy and take note of the connection string on the right blade.

Your IoT hub is now created, and you have the URI and connection string you need to complete this tutorial.

For the creation of the Stream Analytics job Input, you will need to retreive some informations from the IoT Hub:
  - From the Messaging blade (found in the settings blade), write down the **Event Hub-compatible name**
  - Look at the **Event-hub-compatible Endpoint**, and write down this part: sb://**thispart**.servicebus.windows.net/ we will call this one the **IoTHub EventHub-compatible namespace**
  - From the "shared access policies" blade, select **iothubowner** and write down the **Primary Key**
    
#### Create an Event hub
1. Log on to the [Azure Preview Portal].

2. In the jumpbar, click **New**, then click **Internet of Things**, and then click **Event Hub**

3. Enter the following settings for the Event Hub (use a name of your choice for the event hub and the namespace):
  - Event Hub Name: "*myeventhubname*"
  - Region: your choice
  - Subscription: your choice
  - Namespace Name: *mynamespacename-ns*
  
 4. Click on **Create Event Hub**
 
 5. Select the *mynamespacename-ns* and go in the **Event Hub** tab
 
 6. Select the *myeventhubname* event hub and go in the **Configure** tab
 
 7. in the **Shared Access Policies** section, add a new policy:
  - Name = "readwrite"
  - Permissions = Send, Listen
  
 8. Click **Save**, then go to the evnet hub **Dashboard** tab and click on **Connection Information** at the bottom
 
 9. Write down the connection string for the readwrite policy name.
 
 #### Create a Stream Analytics job
1. Log on to the [Azure Preview Portal].

2. In the jumpbar, click **New**, then click **Internet of Things**, and then click **Azure Stream Analytics**.

3. Enter a name for the job, a prefered region, choose your subscription.

4. Once the job is created, go to the **Inputs** tab and add an input. Select **Data stream**, then **IoT Hub**

5. For the Event Hub settings, enter the following:
  - Input Alias = "accel"
  - Subscription = Select the subscription on which you created your IoTHub (usually same as the one you are working on)
  - Choose an IoT Hub = select the IoTHub you created previously in the drop down list
  - IoT Hub Shared Access Policy Name = "iothubowner"
  - IoT Hub Consumer Group = $Default

6. Select JSON - UTF8 for the serialization settings

7. In the **Query** tab, type in the below query and click **Save** below

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

8. In the **Outputs** tab, select **Add an Output**

9. Choose **Event Hub** and enter the following settings:
  - Output Alias = "accel4twitter"
  - Subscription = Pick the one you created the event hub in during previous step
  - Choose a Namespace = "*mynamespacename-ns*"
  - Choose and EventHub = "*myeventhubname*"
  - Event Hub Policy Name = "readwrite"
  
10. choose JSON, UTF8, Line separated for the serialization settings

11. Start the job by clicking on **Start** at the bottom

#### Create a storage account
1. Log on to the [Azure Preview Portal].

2. In the jumpbar, click **New** and select **Data + Storage** then **Storage Account**

3. Choose **Classic** for the deployment model and click on **create**

4. Enter the name of your choice (i.e. "*mystorageaccountname*" for the account name and select your resource group, subscription,... then click on "Create"

5. Once the account is created, find it in the resources blade and write down the primary connection string for it to configure the worker role

#### Get a twitter app consumer and access information
1. In a browser, go to https://apps.twitter.com/

2. Login with your twitter account

3. Click on "Create New App" button and follow instructions

4. In the **Keys and Access Tokens** tab, read and write down the various keys and tokens

#### Deploy the worker role
The sample uses a worker role to trigger alerts back on devices through IoT Hub.
To build an deploy the worker role here are the few simple steps:

1. Clone the [repository](https://github.com/Azure-Samples/iot-hub-nodejs-intel-edison-vibration-anomaly-detection) on your machine (see the links  on top of this tutorial)

2. Open the solution events_to_device_service\events_to_device_service.sln in Visual Studio 2015

3. open the file app.config and replace the fields below with the connection strings from the Event Hub, the IoT Hub, the storage account and your Twitter account

    ```
    <add key="Microsoft.ServiceBus.ConnectionString" value="<<Enter your EH connection string>>" />
    <add key="Microsoft.ServiceBus.EventHubName" value="<<Enter your EH name string>>" />
    <add key="AzureStorage.AccountName" value="<<Enter your Storage account name>>" />
    <add key="AzureStorage.Key" value="<<Enter your storage account key>>" />
    <add key="Twitter.ConsumerKey" value="<<Enter your Twitter consumer key>>" />
    <add key="Twitter.ConsumerSecret" value="<<Enter your Twitter consumer secret>>" />
    <add key="Twitter.AccessToken" value="<<Enter your Twitter access token>>" />
    <add key="Twitter.AccessSecret" value="<<Enter your Twitter access secret>>" />
    <add key="AzureIoTHub.ConnectionString" value="[IoT Hub Connection String]" />
    ```
4. Compile the project and publish to Azure

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
For deploying the application on the Intel Edison, we are using the Intel XDK IDE. You can consider deploying the node app manually if you prefer.
1. Clone the project [repository](https://github.com/Azure-Samples/iot-hub-nodejs-intel-edison-vibration-anomaly-detection/) on your machine (see the links  on top of this tutorial)

2. Start Intel XDK

3. Create a new project, choose a **Blank Template** in the Templates tab and click **Continue**

4. Enter the project name of your choice, for example: tweetmyvibe, click **Create**

5. Open the package.json file and cpy paste the content from the js\package.json file from the repository of the project you cloned at step 1.

6. Open the main.js file and cpy paste the content from the js\main.js file from the repository of the project you cloned at step 1.

7. In the main.js file, search for the below code and replace the connection string and DeviceID placeholders with your IoTHub connection string for the device you created in it and the DeviceID

  ```
  // Set the credentials for the event hub, where the data should be uploaded
  var connectionstring = '<<Enter your service bus namespace connection string here>>';
  var deviceID = '<<Enter your deviceID>>'; // must match the deviceID in the connection string
  ```
  
8. In the Intel XDK tool, compile the project (using the icon with a hammer in it) then click on the Play button to start runnig the app on the device

At this point  your device is connected to IoT Hub and sends telemetry data.
The Stream Analytics Job will detect when the acceleration.z value is negative and will post an alert in the event hub.
The worker role will pick up the alerts, will notify the device that an alert was triggered and will tweet the alert. 

## More information
Coming soon...