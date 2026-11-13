import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../services/audioEngine';

interface HardwareCountertop3DProps {
  isListening: boolean;
  onToggleListening: () => void;
  dspActive: boolean;
  isNoiseActive: boolean;
}

export const HardwareCountertop3D: React.FC<HardwareCountertop3DProps> = ({
  isListening,
  onToggleListening,
  dspActive,
  isNoiseActive
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 240;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141413);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 4.2, 7.8);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lighting (Warm Brass & Industrial White)
    const ambientLight = new THREE.AmbientLight(0xfff7e6, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    dirLight.position.set(5, 10, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const redAccentLight = new THREE.PointLight(0xd9381e, 1.2, 8);
    redAccentLight.position.set(-2, 2, 2);
    scene.add(redAccentLight);

    const brassAccentLight = new THREE.PointLight(0xc88a2b, 1.0, 8);
    brassAccentLight.position.set(2, 2, 2);
    scene.add(brassAccentLight);

    // Root Hardware Unit Group
    const hardwareGroup = new THREE.Group();
    scene.add(hardwareGroup);

    // Countertop Base Plane (Warm Wood / Industrial Composite)
    const tableGeo = new THREE.PlaneGeometry(16, 12);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1f1e1b,
      roughness: 0.9,
      metalness: 0.1
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.rotation.x = -Math.PI / 2;
    tableMesh.position.y = -0.05;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Countertop Grid Lines
    const gridHelper = new THREE.GridHelper(16, 32, 0x33322e, 0x242421);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Hardware Chassis (Milled Carbon Black Aluminum)
    const chassisGeo = new THREE.BoxGeometry(6.4, 0.55, 3.8);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x181816,
      roughness: 0.35,
      metalness: 0.85
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.28;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    hardwareGroup.add(chassis);

    // Brass Corner Hex Screws
    const screwGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8);
    const screwMat = new THREE.MeshStandardMaterial({
      color: 0xc88a2b,
      roughness: 0.3,
      metalness: 0.9
    });
    const screwPositions = [
      [-3.0, 0.58, -1.7],
      [3.0, 0.58, -1.7],
      [-3.0, 0.58, 1.7],
      [3.0, 0.58, 1.7]
    ];
    for (const pos of screwPositions) {
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(pos[0], pos[1], pos[2]);
      hardwareGroup.add(screw);
    }

    // Recessed Acoustic Display Bed
    const displayBedGeo = new THREE.BoxGeometry(3.6, 0.1, 2.4);
    const displayBedMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c0b,
      roughness: 0.6,
      metalness: 0.2
    });
    const displayBed = new THREE.Mesh(displayBedGeo, displayBedMat);
    displayBed.position.set(-1.1, 0.56, 0);
    hardwareGroup.add(displayBed);

    // 3D Spectrum Columns (24 Interactive Frequency Equalizer Bars)
    const numBars = 24;
    const barWidth = 0.11;
    const barSpacing = 0.14;
    const barGeo = new THREE.BoxGeometry(barWidth, 1, 0.08);
    const bars: THREE.Mesh[] = [];

    for (let i = 0; i < numBars; i++) {
      const isPeakBand = i > 12 && i < 18;
      const barMat = new THREE.MeshStandardMaterial({
        color: isPeakBand ? 0xd9381e : 0xc88a2b,
        roughness: 0.3,
        metalness: 0.7
      });
      const bar = new THREE.Mesh(barGeo, barMat);
      const xPos = -1.1 - ((numBars - 1) * barSpacing) / 2 + i * barSpacing;
      bar.position.set(xPos, 0.62, 0.4);
      bar.scale.y = 0.1;
      hardwareGroup.add(bar);
      bars.push(bar);
    }

    // Physical Push-To-Talk Mechanical Switch (Red Kirana Block)
    const pttBaseGeo = new THREE.BoxGeometry(1.5, 0.12, 1.2);
    const pttBaseMat = new THREE.MeshStandardMaterial({
      color: 0x222220,
      roughness: 0.5,
      metalness: 0.5
    });
    const pttBase = new THREE.Mesh(pttBaseGeo, pttBaseMat);
    pttBase.position.set(1.9, 0.58, 0.4);
    hardwareGroup.add(pttBase);

    const pttButtonGeo = new THREE.BoxGeometry(1.3, 0.22, 1.0);
    const pttButtonMat = new THREE.MeshStandardMaterial({
      color: 0xd9381e,
      roughness: 0.2,
      metalness: 0.6
    });
    const pttButton = new THREE.Mesh(pttButtonGeo, pttButtonMat);
    pttButton.position.set(1.9, 0.72, 0.4);
    pttButton.castShadow = true;
    hardwareGroup.add(pttButton);

    // Rotary Knobs (Knurled Brass & Matte Black)
    const knobGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.22, 16);
    const knobMat = new THREE.MeshStandardMaterial({
      color: 0xc88a2b,
      roughness: 0.35,
      metalness: 0.95
    });
    const knob1 = new THREE.Mesh(knobGeo, knobMat);
    knob1.position.set(1.3, 0.68, -0.8);
    hardwareGroup.add(knob1);

    const knob2 = new THREE.Mesh(knobGeo, knobMat);
    knob2.position.set(2.4, 0.68, -0.8);
    hardwareGroup.add(knob2);

    // Hardware LED Indicators
    const ledGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const recLedMat = new THREE.MeshBasicMaterial({ color: 0x331111 });
    const recLed = new THREE.Mesh(ledGeo, recLedMat);
    recLed.position.set(-2.6, 0.6, -1.2);
    hardwareGroup.add(recLed);

    const pwrLedMat = new THREE.MeshBasicMaterial({ color: 0xc88a2b });
    const pwrLed = new THREE.Mesh(ledGeo, pwrLedMat);
    pwrLed.position.set(-2.8, 0.6, -1.2);
    hardwareGroup.add(pwrLed);

    // Raycaster for Interactive Click on 3D PTT Button
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([pttButton, pttBase], true);
      if (intersects.length > 0) {
        audioEngine.playMechanicalClick();
        onToggleListening();
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Mouse Parallax
    let targetRotationY = 0;
    let targetRotationX = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetRotationY = nx * 0.12;
      targetRotationX = ny * 0.08;
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Animation Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth parallax dampening
      hardwareGroup.rotation.y += (targetRotationY - hardwareGroup.rotation.y) * 0.05;
      hardwareGroup.rotation.x += (targetRotationX - hardwareGroup.rotation.x) * 0.05;

      // PTT Button physical depression state
      const targetBtnY = isListeningRef.current ? 0.62 : 0.72;
      pttButton.position.y += (targetBtnY - pttButton.position.y) * 0.3;

      // PTT LED Glow
      if (isListeningRef.current) {
        recLedMat.color.setHex(0xd9381e);
      } else {
        recLedMat.color.setHex(0x331111);
      }

      // Audio Frequency Spectrum Reactive Modulation
      const freqData = audioEngine.getFrequencyData();
      for (let i = 0; i < bars.length; i++) {
        const bin = Math.floor((i / bars.length) * (freqData.length * 0.5));
        const val = freqData[bin] || 0;
        const normalizedScale = isListeningRef.current
          ? Math.max(0.08, (val / 255) * 1.5)
          : Math.max(0.05, 0.05 + Math.sin(Date.now() * 0.003 + i * 0.4) * 0.03);

        bars[i].scale.y += (normalizedScale - bars[i].scale.y) * 0.25;
        bars[i].position.y = 0.56 + bars[i].scale.y / 2;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Window and Container Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onToggleListening]);

  return (
    <div className="relative border border-[#2D2D2A] bg-[#141413] select-none w-full">
      {/* Hardware Top Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#232320] bg-[#1A1A18] text-xs font-mono-tech text-[#A8A49C]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className={`mech-led ${isListening ? 'active-red' : ''}`} />
            <span className="font-semibold">[REC_PTT_ENGINE]</span>
          </span>
          <span className="flex items-center gap-2">
            <span className={`mech-led ${dspActive ? 'active-green' : ''}`} />
            <span>[DSP_NOISE_GATE]</span>
          </span>
          <span className="flex items-center gap-2">
            <span className={`mech-led ${isNoiseActive ? 'active-red' : ''}`} />
            <span>[NOISE_SIMULATOR]</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>MODEL: TE-VK-100</span>
          <span className="text-[#C88A2B] font-bold">[CLICK 3D SWITCH OR SPACEBAR]</span>
        </div>
      </div>

      {/* 3D WebGL Countertop Container */}
      <div ref={containerRef} className="w-full h-[260px] cursor-pointer" />

      {/* Screws and Technical Stamp */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#141413] border-t border-[#232320] text-[11px] font-mono-tech text-[#575550]">
        <span>CHASSIS: MILLED CNC 6061-T6 // ANODIZED CARBON</span>
        <span>LATENCY TARGET: &lt; 2000MS E2E</span>
      </div>
    </div>
  );
};
