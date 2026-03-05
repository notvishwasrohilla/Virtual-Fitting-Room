import { Canvas, useFrame } from "@react-three/fiber/native";
import React, { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as THREE from "three";

// 1. THE FPS COUNTER
function FPSMonitor({ setFps }: { setFps: (fps: number) => void }) {
  const frames = useRef(0);
  const prevTime = useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const time = performance.now();
    if (time >= prevTime.current + 1000) {
      setFps(Math.round((frames.current * 1000) / (time - prevTime.current)));
      frames.current = 0;
      prevTime.current = time;
    }
  });
  return null;
}

// 2. THE CLOTH PHYSICS ENGINE + THE BODY
function DrapingSimulator({
  bodyRadius,
  resetTrigger,
}: {
  bodyRadius: number;
  resetTrigger: number;
}) {
  const clothRef = useRef<THREE.Mesh>(null);
  const bodyPosition = new THREE.Vector3(0, 0, 0);

  // Create original cloth coordinates to fall from
  const initialPositions = useMemo(() => {
    const geom = new THREE.PlaneGeometry(5, 5, 80, 80); // 6,400 vertices!
    geom.rotateX(-Math.PI / 2); // Lay it flat above the body
    geom.translate(0, 4, 0); // Move it high up in the air
    return geom.attributes.position.clone();
  }, [resetTrigger]); // Re-generate when reset is pressed

  useFrame(() => {
    if (!clothRef.current) return;

    const positions = clothRef.current.geometry.attributes.position;
    const initial = initialPositions;

    // NUCLEAR PHYSICS LOOP: Recalculate 6,400 vertices 120 times a second
    for (let i = 0; i < positions.count; i++) {
      let currentY = positions.getY(i);
      const startX = initial.getX(i);
      const startZ = initial.getZ(i);

      // Gravity pulls the cloth down
      if (currentY > -2) {
        currentY -= 0.05;
      }

      // COLLISION DETECTION: Check distance from this exact thread to the center of the body
      const distToBody = Math.sqrt(
        (startX - bodyPosition.x) ** 2 +
          (currentY - bodyPosition.y) ** 2 +
          (startZ - bodyPosition.z) ** 2,
      );

      // If the cloth hits the body, stretch and wrap it over the surface!
      if (distToBody < bodyRadius + 0.05) {
        // Calculate the vector pushing out from the sphere
        const nx = (startX - bodyPosition.x) / distToBody;
        const ny = (currentY - bodyPosition.y) / distToBody;
        const nz = (startZ - bodyPosition.z) / distToBody;

        // Snap the cloth exactly to the expanding/contracting body surface
        positions.setXYZ(
          i,
          bodyPosition.x + nx * (bodyRadius + 0.05),
          bodyPosition.y + ny * (bodyRadius + 0.05),
          bodyPosition.z + nz * (bodyRadius + 0.05),
        );
      } else {
        // Free-falling cloth
        positions.setXYZ(i, startX, currentY, startZ);
      }
    }

    // Tell the GPU to completely redraw the mesh shape
    positions.needsUpdate = true;
    clothRef.current.geometry.computeVertexNormals(); // Expensive shadow calculation
  });

  return (
    <group>
      {/* THE MANNEQUIN BODY */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[bodyRadius, 64, 64]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>

      {/* THE DRAPING CLOTH */}
      <mesh ref={clothRef} castShadow receiveShadow>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={initialPositions.array}
            count={initialPositions.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            array={new THREE.PlaneGeometry(5, 5, 80, 80).index!.array}
            count={new THREE.PlaneGeometry(5, 5, 80, 80).index!.count}
            itemSize={1}
          />
        </bufferGeometry>
        {/* Wireframe so you can watch the individual threads collide and stretch */}
        <meshPhysicalMaterial
          color="#00E5FF"
          side={THREE.DoubleSide}
          wireframe={true}
        />
      </mesh>
    </group>
  );
}

export default function RenderTest() {
  const [fps, setFps] = useState(0);
  const [bodySize, setBodySize] = useState(1.5);
  const [reset, setReset] = useState(0);

  const fpsColor = fps >= 55 ? "#00FF00" : fps >= 30 ? "#FFFF00" : "#FF0000";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nuclear Load Test</Text>
        <Text style={[styles.fpsText, { color: fpsColor }]}>FPS: {fps}</Text>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas shadows camera={{ position: [0, 2, 8], fov: 50 }}>
          <FPSMonitor setFps={setFps} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={2} castShadow />

          <DrapingSimulator bodyRadius={bodySize} resetTrigger={reset} />
        </Canvas>
      </View>

      {/* ON-THE-FLY CUSTOMIZATION CONTROLS */}
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>
          Custom Dimensions (Body Size): {bodySize.toFixed(2)}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setBodySize((prev) => Math.max(0.5, prev - 0.2))}
          >
            <Text style={styles.btnText}>- Shrink Waist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => setBodySize((prev) => Math.min(3.0, prev + 0.2))}
          >
            <Text style={styles.btnText}>+ Expand Waist</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.resetBtn]}
          onPress={() => setReset((prev) => prev + 1)}
        >
          <Text style={styles.btnText}>Drop New Clothes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
  },
  title: { color: "#FFF", fontSize: 22, fontWeight: "bold" },
  fpsText: { fontSize: 24, fontWeight: "900", fontVariant: ["tabular-nums"] },
  canvasContainer: {
    width: "100%",
    height: 400,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    overflow: "hidden",
  },
  controls: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#222",
    borderRadius: 15,
  },
  controlLabel: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 15,
  },
  btn: {
    flex: 1,
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  resetBtn: { backgroundColor: "#00E5FF" },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
