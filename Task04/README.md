## MSD - Research and Development

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

3. Start unloading before entering the Geofence
4. Start unloading after leaving the Geofence

5. End unloading before entering Geofence
6. End unloading after leaving Geofence

7. Start unload data is not available and End unload data is available
8. Start unload data is available and End unload data is not available

9. Unload data not available

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