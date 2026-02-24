import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoData, setPhotoData] = useState<{
    uri: string;
    base64: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const GEMINI_API_KEY = "--YOUR-GEMINI-API-KEY-HERE--";
  const REMOVE_BG_API_KEY = "--YOUR-REMOVE-BG-API-KEY-HERE--";

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
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });
      if (photo?.uri && photo?.base64) {
        setPhotoData({ uri: photo.uri, base64: photo.base64 });
      }
    }
  };

  const analyzeWithAI = async () => {
    if (!photoData) return;
    setIsProcessing(true);
    setLoadingText("AI is analyzing fashion details...");

    try {
      // THE UPGRADED PROMPT: Center-focus and Contrast Background generation
      const prompt = `Analyze this image. Ignore the background, edges, and any peripheral clothing. Focus STRICTLY on the single largest garment in the direct center of the frame. 
      If it is NOT clear clothing, return exactly {"status": "Invalid"}. 
      If it IS clothing, return a JSON object with this exact structure:
      {
        "status": "Valid",
        "category": "Top" OR "Bottom",
        "itemName": "Short descriptive name (e.g., Faded Wide-Leg Jeans)",
        "tags": ["3 to 5 style keywords", "like", "statement", "grunge"],
        "contrastBg": "Determine the overall color of the item. If the item is dark, output 'light'. If the item is light/white, output 'dark'."
      }
      Return ONLY the raw JSON object. Do not include markdown formatting.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: photoData.base64,
                    },
                  },
                ],
              },
            ],
          }),
        },
      );

      const result = await response.json();

      if (result.error) {
        Alert.alert("Google API Error", result.error.message);
        setIsProcessing(false);
        return;
      }

      let rawText = result.candidates[0].content.parts[0].text.trim();
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "");

      const aiData = JSON.parse(rawText);

      if (aiData.status === "Invalid") {
        Alert.alert(
          "Not Clothing",
          "The AI couldn't detect a clear piece of clothing in the center. Try again!",
        );
        setIsProcessing(false);
        return;
      }

      const category = aiData.category;
      const itemName = aiData.itemName;
      const tags = aiData.tags.join(", ");
      const contrastBg = aiData.contrastBg; // "light" or "dark"

      setLoadingText(`Found: ${itemName}!\nRemoving background...`);

      // We now pass the contrast setting to the save function
      await cutBackgroundAndSave(category, itemName, tags, contrastBg);
    } catch (error: any) {
      console.log("CRITICAL CRASH LOG:", error.message || error);
      Alert.alert("AI Error", "Could not analyze the fashion details.");
      setIsProcessing(false);
    }
  };

  const cutBackgroundAndSave = async (
    category: string,
    itemName: string,
    tags: string,
    contrastBg: string,
  ) => {
    try {
      const formData = new FormData();
      formData.append("size", "auto");
      formData.append("image_file", {
        uri: photoData!.uri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as any);

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": REMOVE_BG_API_KEY,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) throw new Error(`Remove.bg failed`);

      const jsonResponse = await response.json();
      const base64Image = jsonResponse.data.result_b64;

      const safeItemName = itemName.replace(/[^a-zA-Z0-9]/g, "-");

      // NEW: We inject the word "light" or "dark" right into the file name!
      // Example: Bottom_Faded-Jeans_light_12345.png
      const newFileName = `${category}_${safeItemName}_${contrastBg}_${Date.now()}.png`;
      const newPath = FileSystem.documentDirectory + newFileName;

      await FileSystem.writeAsStringAsync(newPath, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert(
        "Saved to Closet!",
        `Item: ${itemName}\nTags: ${tags}\nBest Background: ${contrastBg.toUpperCase()}`,
      );
      setPhotoData(null);
    } catch (error: any) {
      Alert.alert("Extraction Error", "Could not remove the background.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (photoData) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoData.uri }} style={styles.preview} />

        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={styles.processingText}>{loadingText}</Text>
          </View>
        ) : (
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setPhotoData(null)}
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#00E5FF" }]}
              onPress={analyzeWithAI}
            >
              <Text style={styles.buttonText}>Analyze Outfit</Text>
            </TouchableOpacity>
          </View>
        )}
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
  buttonText: { color: "#000", fontSize: 16, fontWeight: "bold" },
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
  processingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  processingText: {
    color: "#00E5FF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
