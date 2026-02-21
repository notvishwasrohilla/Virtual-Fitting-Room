import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
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
  const router = useRouter();

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

  // NEW: We now pass a "category" word into the save function
  const savePhoto = async (category: string) => {
    if (photoUri) {
      const originalName = photoUri.split("/").pop();
      // We glue the category to the front of the name!
      const newFileName = `${category}_${originalName}`;
      const newPath = FileSystem.documentDirectory + newFileName;

      try {
        await FileSystem.moveAsync({
          from: photoUri,
          to: newPath,
        });
        Alert.alert("Success!", `Saved as a ${category}.`);
        setPhotoUri(null);
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

          {/* NEW: Category Buttons instead of "Use This" */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#FF6B6B" }]}
            onPress={() => savePhoto("Top")}
          >
            <Text style={styles.buttonText}>Top</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#4D96FF" }]}
            onPress={() => savePhoto("Bottom")}
          >
            <Text style={styles.buttonText}>Bottom</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />

      <TouchableOpacity
        style={styles.closetButton}
        onPress={() => router.push("/closet")}
      >
        <Text style={styles.closetButtonText}>My Closet</Text>
      </TouchableOpacity>

      <View style={styles.overlay}>
        <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: "contain" },
  overlay: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    zIndex: 1,
  },
  closetButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    zIndex: 2,
  },
  closetButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  text: { color: "#FFF", textAlign: "center", marginBottom: 20 },
  button: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
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
