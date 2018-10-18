import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MapView , Polyline} from "expo";
//import MapView, { Polyline } from 'react-native-maps';

let arr  = require('./coordinates').arr;



export default class App extends React.Component {
  render() {
    return (
      <MapView
        style={{
          flex: 1
        }}
        initialRegion={{
          latitude: 29.642701574725,
          longitude: -98.2168150375375,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        }}
      >
      <MapView.Polyline
          coordinates={[...arr]}
          lineJoin="round"
          strokeWidth={4}
          strokeColor="rgba(255,140,0,0.8)"/>
      </MapView>
    );
  }
}
