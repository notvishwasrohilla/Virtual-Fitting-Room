import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import {
    Animated,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Canvas() {
  const router = useRouter();
  const { selectedImage } = useLocalSearchParams<{ selectedImage: string }>();

  // 1. The tracker: This holds the exact X and Y coordinates of the clothing
  const pan = useRef(new Animated.ValueXY()).current;

  // 2. The physics engine: This reads your finger movements
  const panResponder = useRef(
    PanResponder.create({
      // Tell the app we want to claim the touch event when the user drags
      onMoveShouldSetPanResponder: () => true,

      // When the user first taps the clothing:
      onPanResponderGrant: () => {
        // Memorize where the item currently is so it doesn't snap back to the center
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },

      // When the user is actively dragging their finger:
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }, // Tie the finger movement directly to our X and Y tracker
        ],
        { useNativeDriver: false }, // Required for layout animations like moving around
      ),

      // When the user lets go of the screen:
      onPanResponderRelease: () => {
        // Flatten the offset so the next drag starts exactly from this new spot
        pan.flattenOffset();
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Outfit Canvas</Text>

      <View style={styles.canvasArea}>
        {selectedImage ? (
          // 3. We wrap the Image inside an Animated.View and attach the physics engine to it
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              pan.getLayout(), // This applies the real-time X and Y coordinates to the UI
              styles.stagedItemContainer,
            ]}
          >
            <Image
              source={{ uri: FileSystem.documentDirectory + selectedImage }}
              style={styles.stagedItem}
            />
          </Animated.View>
        ) : (
          <Text style={styles.emptyText}>
            Go back to your closet and select an item!
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back to Closet</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  canvasArea: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    margin: 20,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  stagedItemContainer: {
    // We put the size restrictions on the container, not the image itself, for smoother dragging
    width: 250,
    height: 250,
  },
  stagedItem: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    fontStyle: "italic",
  },
  backButton: {
    backgroundColor: "#00E5FF",
    padding: 15,
    marginHorizontal: 40,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 40,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});
