import { useTexture } from "@react-three/drei/native"; // NEW: The native-safe texture loader
import { Canvas } from "@react-three/fiber/native";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { Suspense, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as THREE from "three";

// Stabilize the shadow map config to prevent WeakMap re-allocation issues
const SHADOW_CONFIG = { type: THREE.PCFShadowMap };

// NEW: We extract the material into its own component to prevent React Hook errors
function TexturedMaterial({ imageUri }: { imageUri: string }) {
  // useTexture uses React Native's native file system instead of an HTML <img> tag
  const texture = useTexture(imageUri);
  return (
    <meshStandardMaterial
      map={texture}
      color="#FFFFFF"
      transparent={true}
      roughness={0.8}
    />
  );
}

function ParametricTorso({
  chest,
  waist,
  torsoHeight,
  imageUri,
}: {
  chest: number;
  waist: number;
  torsoHeight: number;
  imageUri: string | null;
}) {
  return (
    <mesh
      key={`${chest}-${waist}-${torsoHeight}`} // Forces a clean swap when geometry changes
      scale={[1, 1, 0.6]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[chest, waist, torsoHeight, 32, 16]} />

      {/* If we have a clothing image, paint it. If not, fallback to the cyan placeholder. */}
      {imageUri ? (
        <TexturedMaterial imageUri={imageUri} />
      ) : (
        <meshStandardMaterial color="#00E5FF" roughness={0.8} />
      )}
    </mesh>
  );
}

export default function CanvasScreen() {
  const router = useRouter();
  const [isTextureLoading, setIsTextureLoading] = useState(false);
  const { selectedImage } = useLocalSearchParams<{ selectedImage: string }>();

  // Construct the native file path
  const imageUri = selectedImage
    ? FileSystem.documentDirectory + selectedImage
    : null;

  const [chest, setChest] = useState(1.2);
  const [waist, setWaist] = useState(1.0);
  const [torsoHeight, setTorsoHeight] = useState(2.5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VFR: Texture Projection</Text>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas
          shadows={SHADOW_CONFIG}
          camera={{ position: [0, 0, 5], fov: 50 }}
          onCreated={(state) => {
            const gl = state.gl.getContext();
            if (gl && typeof gl.pixelStorei === "function") {
              // 1 is safer than 4 for arbitrary mobile photo dimensions
              gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            }
          }}
        >
          <ambientLight intensity={0.6} />
          <Suspense fallback={null}>
            <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
            <pointLight
              position={[-5, -5, -5]}
              intensity={0.5}
              color="#ffffff"
            />

            <ParametricTorso
              chest={chest}
              waist={waist}
              torsoHeight={torsoHeight}
              imageUri={imageUri}
            />
          </Suspense>
        </Canvas>

        {/* Overlay loader so the Canvas doesn't unmount during texture swaps */}
        {imageUri && (
          <Suspense fallback={<TextureLoaderOverlay />}>
            <TextureWatcher imageUri={imageUri} />
          </Suspense>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlRow}>
          <Text style={styles.label}>Shoulders/Chest</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setChest((p) => Math.max(0.5, p - 0.1))}
            >
              <Text style={styles.btnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setChest((p) => Math.min(2.5, p + 0.1))}
            >
              <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.label}>Waist/Hips</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setWaist((p) => Math.max(0.5, p - 0.1))}
            >
              <Text style={styles.btnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setWaist((p) => Math.min(2.5, p + 0.1))}
            >
              <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Closet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper components to handle loading UI without unmounting the Canvas
function TextureWatcher({ imageUri }: { imageUri: string }) {
  useTexture(imageUri);
  return null;
}

function TextureLoaderOverlay() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
      <ActivityIndicator size="large" color="#00E5FF" />
      <Text style={styles.loadingText}>Applying Texture...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, paddingTop: 50 },
  header: { marginBottom: 15, alignItems: "center" },
  title: { color: "#FFF", fontSize: 22, fontWeight: "bold" },
  canvasContainer: {
    width: "100%",
    height: 400,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
    justifyContent: "center",
  },
  loadingOverlay: {
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#00E5FF", marginTop: 10, fontWeight: "bold" },
  controlsContainer: {
    marginTop: 20,
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  label: { color: "#FFF", fontSize: 16, fontWeight: "600", width: "50%" },
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    width: "40%",
    justifyContent: "flex-end",
  },
  btn: {
    backgroundColor: "#333",
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  backButton: {
    backgroundColor: "#00E5FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: { color: "#000", fontSize: 16, fontWeight: "bold" },
});
