import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MapView , Polyline} from "expo";
//import MapView, { Polyline } from 'react-native-maps';



export default class App extends React.Component {
  render() {
    return (
      <MapView
        style={{
          flex: 1
        }}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        }}
      >
      <MapView.Polyline
          coordinates={[
      { latitude: 37.8025259, longitude: -122.4351431 },
      { latitude: 37.7896386, longitude: -122.421646 },
      { latitude: 37.7665248, longitude: -122.4161628 },
      { latitude: 37.7734153, longitude: -122.4577787 },
      { latitude: 37.7948605, longitude: -122.4596065 }
    ]}
          lineJoin="miter"
          strokeWidth={4}
          strokeColor="rgba(255,140,0,0.8)"/>
      </MapView>
    );
  }
}