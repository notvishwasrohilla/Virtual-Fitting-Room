import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
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

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const files = await FileSystem.readDirectoryAsync(
      FileSystem.documentDirectory,
    );
    setImages(files);
  };

  // NEW: The Delete Function
  const deleteImage = async (filename: string) => {
    Alert.alert(
      "Throw Away?",
      "Are you sure you want to delete this from your closet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Delete the file from the hard drive
            await FileSystem.deleteAsync(
              FileSystem.documentDirectory + filename,
            );
            // Refresh the closet to show it's gone
            loadImages();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Digital Closet</Text>

      <FlatList
        data={images}
        numColumns={3}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          // NEW: Wrap the Image in a TouchableOpacity that detects a long press
          <TouchableOpacity
            style={styles.thumbnailContainer}
            onLongPress={() => deleteImage(item)}
          >
            <Image
              source={{ uri: FileSystem.documentDirectory + item }}
              style={styles.thumbnail}
            />
          </TouchableOpacity>
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
  // NEW: Added a container to hold the image properly
  thumbnailContainer: {
    width: "30%",
    aspectRatio: 1,
    margin: "1.5%",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
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
