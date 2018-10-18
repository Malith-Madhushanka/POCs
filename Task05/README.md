## MSD - Research and Development
___

### For Data storing
Collecting truck route data from Telogis API and store in MongoDB

#### Run

default (without parameters - yesterday to today)
```
npm start 
```
with parameters
```
npm start <opcoId> <fromDate> <toDate> <routeState>
```

#### Example
```
npm start 013 2018-02-06 2018-02-10 Complete
```

### For Data analysis
For analyze Telogis data stored in MongoDB.

1. Start unloading within the Geofence
2. End unloading within the Geofence

3. Start unloading before entering the Geofence (with detailed time difference intervals)
4. Start unloading after leaving the Geofence (with detailed time difference intervals)

5. End unloading before entering Geofence (with detailed time difference intervals)
6. End unloading after leaving Geofence (with detailed time difference intervals)

7. Start scanning items before entering the geofence (with detailed time difference intervals)
8. End scanning items after leaving the geofence (with detailed time difference intervals)

9. Scanning items before starting unload (with detailed time difference intervals)
10. Scanning items after ending unload (with detailed time difference intervals)

11. Start unload data is not available and End unload data is available
12. Start unload data is available and End unload data is not available

13. Unload data not available

10. Unload data available and Geofence data not available





#### Run

default (without parameters - yesterday(including) to today, opcoId=013)
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


___


### For storing real-time route data 
Collecting route data in real-time and store them in MongoDB 

#### Run
default (without parameters - today to tomorrow)
```
npm run start-rt 013 
```
with parameters
```
npm run start-rt <opcoId>
```

### For analyzing real-time route data for a given date range

1. Total number of routes
2. Number of routes which had modified (new stops added) when transitioning from 'NotStarted' to 'InProgress' (and % compared to total number of routes).
3. Average number of stops newly added per route for case 2.

4. Number of routes which had modified (new stops added) when transitioning from 'InProgress' to 'Complete' (and % compared to total number of routes).
5. Average number of stops newly added per route for case 4


#### Run

default (without parameters - today(including) to tomorrow, opcoId=013)
```
node RTRouteChangeAnalysis.js 
```
with parameters
```
node RTRouteChangeAnalysis.js <opcoId> <fromDate> <toDate>
```

#### Example
```
node RTRouteChangeAnalysis.js 045 2018-03-12 2018-03-13
```