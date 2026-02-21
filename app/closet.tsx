import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Get the exact width of your phone screen
const { width } = Dimensions.get("window");

export default function Closet() {
  const [tops, setTops] = useState<string[]>([]);
  const [bottoms, setBottoms] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const files = await FileSystem.readDirectoryAsync(
      FileSystem.documentDirectory,
    );
    const myTops = files.filter((file) => file.includes("Top_"));
    const myBottoms = files.filter((file) => file.includes("Bottom_"));
    setTops(myTops);
    setBottoms(myBottoms);
  };

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
            await FileSystem.deleteAsync(
              FileSystem.documentDirectory + filename,
            );
            loadImages();
          },
        },
      ],
    );
  };

  // The component for making images huge and swipeable
  const Garment = ({ item }: { item: string }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => deleteImage(item)}
      style={styles.garmentContainer}
    >
      <Image
        source={{ uri: FileSystem.documentDirectory + item }}
        style={styles.garmentImage}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* THE TOP HALF */}
      <View style={styles.halfScreen}>
        {tops.length === 0 ? (
          <Text style={styles.emptyText}>No tops saved yet.</Text>
        ) : (
          <FlatList
            data={tops}
            horizontal
            pagingEnabled // This forces it to snap beautifully!
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => <Garment item={item} />}
          />
        )}
      </View>

      {/* A small divider line to separate the clothes */}
      <View style={styles.divider} />

      {/* THE BOTTOM HALF */}
      <View style={styles.halfScreen}>
        {bottoms.length === 0 ? (
          <Text style={styles.emptyText}>No bottoms saved yet.</Text>
        ) : (
          <FlatList
            data={bottoms}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => <Garment item={item} />}
          />
        )}
      </View>

      {/* Back Button floating at the bottom */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back to Scanner</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  halfScreen: {
    flex: 1, // Takes up exactly half the available space
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 4,
    backgroundColor: "#333",
    width: "100%",
  },
  garmentContainer: {
    width: width, // Exactly as wide as the phone screen
    height: "100%",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  garmentImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain", // Keeps the whole image visible without stretching
  },
  emptyText: {
    color: "#888",
    fontSize: 18,
    fontStyle: "italic",
  },
  backButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "rgba(0, 229, 255, 0.8)",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
