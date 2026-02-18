import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { useRef, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>VFR needs camera access</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setPhotoUri(photo.uri);
      }
    }
  };

  const savePhoto = async () => {
    if (photoUri) {
      const fileName = photoUri.split("/").pop();
      // This is the permanent folder on your phone
      const newPath = FileSystem.documentDirectory + fileName;

      try {
        await FileSystem.moveAsync({
          from: photoUri,
          to: newPath,
        });
        Alert.alert("Success!", "Outfit saved to your digital closet.");
        setPhotoUri(null); // Reset to take another photo
      } catch (error) {
        console.log(error);
        Alert.alert("Error", "Could not save photo.");
      }
    }
  };

  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setPhotoUri(null)}
          >
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#00E5FF" }]}
            onPress={savePhoto}
          >
            <Text style={styles.buttonText}>Use This</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
    resizeMode: "contain",
  },
  overlay: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  text: {
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "rgba(0,0,0,0.2)",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#000",
  },
});
