using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.WindowsAzure;
using Microsoft.WindowsAzure.Diagnostics;
using Microsoft.WindowsAzure.ServiceRuntime;
using Microsoft.WindowsAzure.Storage;
using Microsoft.Azure.Devices;
using Microsoft.ServiceBus.Messaging;
using System.Configuration;

namespace events_forwarding
{
    public class WorkerRole : RoleEntryPoint
    {
        private readonly CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();
        private readonly ManualResetEvent runCompleteEvent = new ManualResetEvent(false);

        private static string connectionString;
        private static string eventHubName;
        public static ServiceClient iotHubServiceClient { get; private set; }
        public static EventHubClient eventHubClient { get; private set; }

        public override void Run()
        {
            Trace.TraceInformation("EventsForwarding Run()...\n");

            try
            {
                this.RunAsync(this.cancellationTokenSource.Token).Wait();
            }
            finally
            {
                this.runCompleteEvent.Set();
            }
        }

        public override bool OnStart()
        {
            // Set the maximum number of concurrent connections
            ServicePointManager.DefaultConnectionLimit = 12;

            // For information on handling configuration changes
            // see the MSDN topic at http://go.microsoft.com/fwlink/?LinkId=166357.

            bool result = base.OnStart();

            Trace.TraceInformation("EventsForwarding OnStart()...\n");

            connectionString = ConfigurationManager.AppSettings["Microsoft.ServiceBus.ConnectionString"];
            eventHubName = ConfigurationManager.AppSettings["Microsoft.ServiceBus.EventHubName"];

            string storageAccountName = ConfigurationManager.AppSettings["AzureStorage.AccountName"];
            string storageAccountKey = ConfigurationManager.AppSettings["AzureStorage.Key"];
            string storageAccountString = string.Format("DefaultEndpointsProtocol=https;AccountName={0};AccountKey={1}",
                storageAccountName, storageAccountKey);

            string iotHubConnectionString = ConfigurationManager.AppSettings["AzureIoTHub.ConnectionString"];
            iotHubServiceClient = ServiceClient.CreateFromConnectionString(iotHubConnectionString);
            eventHubClient = EventHubClient.CreateFromConnectionString(connectionString, eventHubName);

            var defaultConsumerGroup = eventHubClient.GetDefaultConsumerGroup();

            string eventProcessorHostName = "SensorEventProcessor";
            EventProcessorHost eventProcessorHost = new EventProcessorHost(eventProcessorHostName, eventHubName, defaultConsumerGroup.GroupName, connectionString, storageAccountString);
            eventProcessorHost.RegisterEventProcessorAsync<SensorEventProcessor>().Wait();

            Trace.TraceInformation("Receiving events...\n");

            return result;
        }

        public override void OnStop()
        {
            Trace.TraceInformation("EventsForwarding is OnStop()...");

            this.cancellationTokenSource.Cancel();
            this.runCompleteEvent.WaitOne();

            base.OnStop();

            Trace.TraceInformation("EventsForwarding has stopped");
        }

        private async Task RunAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                //Trace.TraceInformation("EventsToCommmandsService running...\n");
                await Task.Delay(1000);
            }
        }
    }
}
