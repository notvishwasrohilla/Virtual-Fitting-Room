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

const { width } = Dimensions.get("window");

// Moved outside to prevent re-mounting on every Closet render
const Garment = ({
  item,
  onPress,
  onLongPress,
}: {
  item: string;
  onPress: (item: string) => void;
  onLongPress: (item: string) => void;
}) => {
  const parts = item.split("_");
  const rawName = parts.length >= 4 ? parts[1] : "Unknown Item";
  const itemName = rawName.replace(/-/g, " ");
  const contrast = parts.length >= 4 ? parts[2] : "dark";

  const bgColor = contrast === "light" ? "#F5F5F5" : "#222222";
  const labelColor = contrast === "light" ? "#FFFFFF" : "#333333";
  const textColor = contrast === "light" ? "#000000" : "#FFFFFF";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      style={[styles.garmentContainer, { backgroundColor: bgColor }]}
    >
      <Image
        source={{ uri: FileSystem.documentDirectory + item }}
        style={styles.garmentImage}
      />
      <View style={[styles.labelContainer, { backgroundColor: labelColor }]}>
        <Text style={[styles.labelText, { color: textColor }]}>{itemName}</Text>
      </View>
    </TouchableOpacity>
  );
};

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
    const myTops = files.filter((file) => file.startsWith("Top_"));
    const myBottoms = files.filter((file) => file.startsWith("Bottom_"));
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

  return (
    <View style={styles.container}>
      <View style={styles.halfScreen}>
        {tops.length === 0 ? (
          <Text style={styles.emptyText}>No tops saved yet.</Text>
        ) : (
          <FlatList
            data={tops}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Garment
                item={item}
                onPress={(i) => router.push(`/canvas?selectedImage=${i}`)}
                onLongPress={deleteImage}
              />
            )}
          />
        )}
      </View>

      <View style={styles.divider} />

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
            renderItem={({ item }) => (
              <Garment
                item={item}
                onPress={(i) => router.push(`/canvas?selectedImage=${i}`)}
                onLongPress={deleteImage}
              />
            )}
          />
        )}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back to Scanner</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  halfScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 4,
    backgroundColor: "#000",
    width: "100%",
  },
  garmentContainer: {
    width: width,
    height: "100%",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  garmentImage: {
    width: "100%",
    height: "85%",
    resizeMode: "contain",
  },
  labelContainer: {
    position: "absolute",
    bottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "capitalize",
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
    backgroundColor: "rgba(0, 229, 255, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    elevation: 5,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
