import { Canvas } from "@react-three/fiber/native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 1. THE PARAMETRIC MANNEQUIN
// It takes in the exact measurements from the UI state below
function ParametricTorso({
  chest,
  waist,
  torsoHeight,
}: {
  chest: number;
  waist: number;
  torsoHeight: number;
}) {
  return (
    // We scale the Z-axis down to 0.6 to flatten the cylinder into a more natural, human-like oval shape
    <mesh scale={[1, 1, 0.6]} castShadow receiveShadow>
      {/* args: [RadiusTop, RadiusBottom, Height, RadialSegments, HeightSegments]
        We keep segments relatively low (32x16) to ensure hyper-fast 10-second baking later
      */}
      <cylinderGeometry args={[chest, waist, torsoHeight, 32, 16]} />
      <meshStandardMaterial
        color="#00E5FF"
        wireframe={true} // Kept as wireframe so you can see the polygon structure curve
        roughness={0.5}
      />
    </mesh>
  );
}

export default function CanvasScreen() {
  // 2. THE MEASUREMENT STATE
  const [chest, setChest] = useState(1.2);
  const [waist, setWaist] = useState(1.0);
  const [torsoHeight, setTorsoHeight] = useState(2.5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VFR: Measurement Profile</Text>
      </View>

      {/* 3. THE 3D STAGE */}
      <View style={styles.canvasContainer}>
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ff0044" />

          <ParametricTorso
            chest={chest}
            waist={waist}
            torsoHeight={torsoHeight}
          />
        </Canvas>
      </View>

      {/* 4. THE CUSTOMIZATION CONTROLS */}
      <View style={styles.controlsContainer}>
        {/* Chest Controls */}
        <View style={styles.controlRow}>
          <Text style={styles.label}>Shoulders/Chest: {chest.toFixed(2)}</Text>
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

        {/* Waist Controls */}
        <View style={styles.controlRow}>
          <Text style={styles.label}>Waist/Hips: {waist.toFixed(2)}</Text>
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

        {/* Height Controls */}
        <View style={styles.controlRow}>
          <Text style={styles.label}>
            Torso Length: {torsoHeight.toFixed(2)}
          </Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setTorsoHeight((p) => Math.max(1.5, p - 0.1))}
            >
              <Text style={styles.btnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setTorsoHeight((p) => Math.min(4.0, p + 0.1))}
            >
              <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  },
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
    backgroundColor: "#00E5FF",
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#000", fontSize: 20, fontWeight: "bold" },
});
