using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace events_forwarding
{
    [DataContract]
    class SensorEvent
    {
        [DataMember]
        public string deviceid { get; set; }

        [DataMember]
        public float x { get; set; }

        [DataMember]
        public float y { get; set; }

        [DataMember]
        public float z { get; set; }
    }
}
