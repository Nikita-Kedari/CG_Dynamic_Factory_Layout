export const threeAssembliesFactory = {
  "id": "101",
  "name": "Pune Compact SUV Manufacturing Plant",
  "width": 3190,
  "height": 2390,
  "gridUnit": 50,
  "flows": [
    {
      "id": "1",
      "fromWsId": "1",
      "toWsId": "2",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "2",
      "fromWsId": "2",
      "toWsId": "3",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "3",
      "fromWsId": "3",
      "toWsId": "4",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "4",
      "fromWsId": "4",
      "toWsId": "5",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "5",
      "fromWsId": "5",
      "toWsId": "6",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "6",
      "fromWsId": "6",
      "toWsId": "7",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "7",
      "fromWsId": "7",
      "toWsId": "8",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "8",
      "fromWsId": "8",
      "toWsId": "9",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "10",
      "fromWsId": "10",
      "toWsId": "11",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "11",
      "fromWsId": "11",
      "toWsId": "12",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "12",
      "fromWsId": "12",
      "toWsId": "13",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "13",
      "fromWsId": "13",
      "toWsId": "14",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "14",
      "fromWsId": "14",
      "toWsId": "15",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "15",
      "fromWsId": "15",
      "toWsId": "16",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "16",
      "fromWsId": "16",
      "toWsId": "17",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "17",
      "fromWsId": "17",
      "toWsId": "18",
      "arrowType": "Conveyor",
      "label": "Vehicle Flow"
    },
    {
      "id": "19",
      "fromWsId": "19",
      "toWsId": "20",
      "arrowType": "Conveyor",
      "label": "Engine Flow"
    },
    {
      "id": "20",
      "fromWsId": "20",
      "toWsId": "21",
      "arrowType": "Conveyor",
      "label": "Engine Flow"
    },
    {
      "id": "21",
      "fromWsId": "21",
      "toWsId": "22",
      "arrowType": "Conveyor",
      "label": "Engine Flow"
    },
    {
      "id": "22",
      "fromWsId": "22",
      "toWsId": "23",
      "arrowType": "Conveyor",
      "label": "Engine Flow"
    },
    {
      "id": "23",
      "fromWsId": "23",
      "toWsId": "24",
      "arrowType": "Conveyor",
      "label": "Engine Flow"
    },
    {
      "id": "24",
      "fromWsId": "24",
      "toWsId": "25",
      "arrowType": "Conveyor",
      "label": "Engine Flow"
    },
    {
      "id": "25",
      "fromWsId": "25",
      "toWsId": "26",
      "arrowType": "Conveyor",
      "label": "Engine Flow"
    },
    {
      "id": "26",
      "fromWsId": "26",
      "toWsId": "27",
      "arrowType": "Conveyor",
      "label": "Engine Flow"
    }
  ],
  "areas": [
    {
      "id": "11",
      "areaId": "11",
      "areaName": "Chassis Assembly",
      "x": 150,
      "y": 200,
      "width": 1040,
      "height": 1190,
      "lines": [
        {
          "id": "201",
          "lineId": "201",
          "lineName": "Chassis Assembly Line",
          "x": 150,
          "y": 200,
          "width": 1040,
          "height": 1190,
          "workCenters": [
            {
              "id": "1",
              "workCenterId": "1",
              "machineName": "w1",
              "name": "w1",
              "wsSequence": 1,
              "x": 250,
              "y": 1250,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w1: Chassis base frame preparation for automobile body"
            },
            {
              "id": "2",
              "workCenterId": "2",
              "machineName": "w2",
              "name": "w2",
              "wsSequence": 2,
              "x": 250,
              "y": 1000,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w2: Engine mounting preparation and alignment"
            },
            {
              "id": "3",
              "workCenterId": "3",
              "machineName": "w3",
              "name": "w3",
              "wsSequence": 3,
              "x": 250,
              "y": 750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w3: Transmission and drivetrain assembly"
            },
            {
              "id": "4",
              "workCenterId": "4",
              "machineName": "w4",
              "name": "w4",
              "wsSequence": 4,
              "x": 250,
              "y": 500,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w4: Suspension and axle installation"
            },
            {
              "id": "5",
              "workCenterId": "5",
              "machineName": "w5",
              "name": "w5",
              "wsSequence": 5,
              "x": 625,
              "y": 300,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w5: Electrical wiring and control unit installation"
            },
            {
              "id": "6",
              "workCenterId": "6",
              "machineName": "w6",
              "name": "w6",
              "wsSequence": 6,
              "x": 1000,
              "y": 500,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w6: Interior assembly and dashboard fitting"
            },
            {
              "id": "7",
              "workCenterId": "7",
              "machineName": "w7",
              "name": "w7",
              "wsSequence": 7,
              "x": 1000,
              "y": 750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w7: Exterior body panel installation"
            },
            {
              "id": "8",
              "workCenterId": "8",
              "machineName": "w8",
              "name": "w8",
              "wsSequence": 8,
              "x": 1000,
              "y": 1000,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w8: Painting and coating of the automobile body"
            },
            {
              "id": "9",
              "workCenterId": "9",
              "machineName": "w9",
              "name": "w9",
              "wsSequence": 9,
              "x": 1000,
              "y": 1250,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w9: Final inspection and quality check"
            }
          ]
        }
      ],
      "buffers": [],
      "storage": []
    },
    {
      "id": "12",
      "areaId": "12",
      "areaName": "Main Framing Assembly",
      "x": 1400,
      "y": 200,
      "width": 1040,
      "height": 1190,
      "lines": [
        {
          "id": "202",
          "lineId": "202",
          "lineName": "Main Framing Line",
          "x": 1400,
          "y": 200,
          "width": 1040,
          "height": 1190,
          "workCenters": [
            {
              "id": "10",
              "workCenterId": "10",
              "machineName": "w10",
              "name": "w10",
              "wsSequence": 1,
              "x": 1500,
              "y": 1250,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w10: Underbody framing"
            },
            {
              "id": "11",
              "workCenterId": "11",
              "machineName": "w11",
              "name": "w11",
              "wsSequence": 2,
              "x": 1500,
              "y": 1000,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w11: Side panel sub-assembly left"
            },
            {
              "id": "12",
              "workCenterId": "12",
              "machineName": "w12",
              "name": "w12",
              "wsSequence": 3,
              "x": 1500,
              "y": 750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w12: Side panel sub-assembly right"
            },
            {
              "id": "13",
              "workCenterId": "13",
              "machineName": "w13",
              "name": "w13",
              "wsSequence": 4,
              "x": 1500,
              "y": 500,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w13: Roof and structure framing"
            },
            {
              "id": "14",
              "workCenterId": "14",
              "machineName": "w14",
              "name": "w14",
              "wsSequence": 5,
              "x": 1875,
              "y": 300,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w14: Spot welding robotic cell 1"
            },
            {
              "id": "15",
              "workCenterId": "15",
              "machineName": "w15",
              "name": "w15",
              "wsSequence": 6,
              "x": 2250,
              "y": 500,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w15: Spot welding robotic cell 2"
            },
            {
              "id": "16",
              "workCenterId": "16",
              "machineName": "w16",
              "name": "w16",
              "wsSequence": 7,
              "x": 2250,
              "y": 750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w16: Dimensional measurement and laser scanning"
            },
            {
              "id": "17",
              "workCenterId": "17",
              "machineName": "w17",
              "name": "w17",
              "wsSequence": 8,
              "x": 2250,
              "y": 1000,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w17: Hemming and closure panels"
            },
            {
              "id": "18",
              "workCenterId": "18",
              "machineName": "w18",
              "name": "w18",
              "wsSequence": 9,
              "x": 2250,
              "y": 1250,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w18: Framing inspection"
            }
          ]
        }
      ],
      "buffers": [],
      "storage": []
    },
    {
      "id": "13",
      "areaId": "13",
      "areaName": "Engine Assembly",
      "x": 400,
      "y": 1650,
      "width": 2290,
      "height": 240,
      "lines": [
        {
          "id": "203",
          "lineId": "203",
          "lineName": "Engine Line",
          "x": 400,
          "y": 1650,
          "width": 2290,
          "height": 240,
          "workCenters": [
            {
              "id": "19",
              "workCenterId": "19",
              "machineName": "w19",
              "name": "w19",
              "wsSequence": 1,
              "x": 500,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w19: Engine block machining"
            },
            {
              "id": "20",
              "workCenterId": "20",
              "machineName": "w20",
              "name": "w20",
              "wsSequence": 2,
              "x": 750,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w20: Cylinder head assembly"
            },
            {
              "id": "21",
              "workCenterId": "21",
              "machineName": "w21",
              "name": "w21",
              "wsSequence": 3,
              "x": 1000,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w21: Crankshaft installation"
            },
            {
              "id": "22",
              "workCenterId": "22",
              "machineName": "w22",
              "name": "w22",
              "wsSequence": 4,
              "x": 1250,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w22: Piston and connecting rod fitting"
            },
            {
              "id": "23",
              "workCenterId": "23",
              "machineName": "w23",
              "name": "w23",
              "wsSequence": 5,
              "x": 1500,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w23: Timing belt and chain attachment"
            },
            {
              "id": "24",
              "workCenterId": "24",
              "machineName": "w24",
              "name": "w24",
              "wsSequence": 6,
              "x": 1750,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w24: Oil pan and pump integration"
            },
            {
              "id": "25",
              "workCenterId": "25",
              "machineName": "w25",
              "name": "w25",
              "wsSequence": 7,
              "x": 2000,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w25: Intake and exhaust manifold"
            },
            {
              "id": "26",
              "workCenterId": "26",
              "machineName": "w26",
              "name": "w26",
              "wsSequence": 8,
              "x": 2250,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w26: Wiring harness and sensors"
            },
            {
              "id": "27",
              "workCenterId": "27",
              "machineName": "w27",
              "name": "w27",
              "wsSequence": 9,
              "x": 2500,
              "y": 1750,
              "width": 90,
              "height": 90,
              "icon": "tool",
              "status": "operational",
              "detail": "w27: Final engine dyno test"
            }
          ]
        }
      ],
      "buffers": [],
      "storage": []
    }
  ]
};