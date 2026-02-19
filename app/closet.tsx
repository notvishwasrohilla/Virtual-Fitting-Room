import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Closet() {
  const [images, setImages] = useState<string[]>([]);
  const router = useRouter();

  // This runs every time you open the screen
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const files = await FileSystem.readDirectoryAsync(
      FileSystem.documentDirectory,
    );

    // We are removing the filter completely!
    // Just grab everything in the folder so we can finally see what Expo is saving them as.
    setImages(files);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Digital Closet</Text>

      <FlatList
        data={images}
        numColumns={3} // show 3 items per row
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Image
            source={{ uri: FileSystem.documentDirectory + item }}
            style={styles.thumbnail}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No clothes yet!</Text>
        }
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back to Camera</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  thumbnail: {
    width: "30%",
    aspectRatio: 1, // keeps it square
    margin: "1.5%",
    borderRadius: 10,
    backgroundColor: "#333",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
  },
  backButton: {
    backgroundColor: "#00E5FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});
