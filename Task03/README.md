### MSD - Research and Development

Analyze Telogis data stored in MongoDB.

1. STS_StartUnloadTime >= ActualArrivalTime AND STS_StartUnloadTime <= ActualDepartureTime
2. STS_StartUnloadTime < ActualArrivalTime
3. STS_StartUnloadTime > ActualDepartureTime
4. STS_EndUnloadTime <= ActualDepartureTime AND STS_EndUnloadTime >= ActualArrivalTime
5. STS_EndUnloadTime < ActualArrivalTime
6. STS_EndUnloadTime > ActualDepartureTime
7. STS_StartUnloadTime is empty AND STS_EndUnloadTime is not empty.
8. STS_StartUnloadTime is not empty AND STS_EndUnloadTime is empty.
9. STS_StartUnloadTime is empty AND STS_EndUnloadTime is empty.
10. STS_StartUnloadTime & STS_EndUnloadTime are not empty AND ActualArrivalTime & ActualDepartureTime are empty.



#### Run

default (without parameters - yesterday to today, opcoId=045)
```
node dataStat.js 
```
with parameters
```
node dataStat.js <opcoId> <fromDate> <toDate> <routeState>
```

#### Example
```
node dataStat.js 045 2018-02-18 2018-02-25
```