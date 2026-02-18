import { CameraView, useCameraPermissions } from "expo-camera";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function App() {
  // This hook asks the Android phone for permission to use the lens
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading in the background
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // The user hasn't granted permission yet. Show them a button!
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          VFR needs your permission to scan clothes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Permission granted! Show the live camera feed.
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <Text style={styles.scanText}>Point at your clothes!</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: 50,
  },
  scanText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
    borderRadius: 10,
    overflow: "hidden",
  },
  text: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#00E5FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 50,
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
});
