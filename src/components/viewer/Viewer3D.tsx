import { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Engine,
  Scene,
  FreeCamera,
  Vector3 as BVector3,
  HemisphericLight,
  DirectionalLight,
  Color3,
  Color4,
} from '@babylonjs/core';
import { useFloorplanStore } from '@store/index';
import { Ground } from './Ground';
import { AreaBox } from './AreaBox';
import { Asset3D } from './Asset3D';

interface Viewer3DProps {
  onHover?: (id: string | null) => void;
}

export function Viewer3D({ onHover }: Viewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<FreeCamera | null>(null);

  // Store state
  const project = useFloorplanStore((state) => state.project);
  const selectedIds = useFloorplanStore((state) => state.selectedIds);
  const camera3d = useFloorplanStore((state) => state.camera3d);
  const setCameraPosition = useFloorplanStore((state) => state.setCameraPosition);
  const setCameraTarget = useFloorplanStore((state) => state.setCameraTarget);
  const setHoveredId = useFloorplanStore((state) => state.setHoveredId);
  const select = useFloorplanStore((state) => state.select);
  const addToSelection = useFloorplanStore((state) => state.addToSelection);

  const lot = project?.lot;
  const rawAreas = project?.areas;
  const rawAssets = project?.assets;

  // Use useMemo to avoid creating new arrays on every render
  const areas = useMemo(() => rawAreas ?? [], [rawAreas]);
  const assets = useMemo(() => rawAssets ?? [], [rawAssets]);

  // Initialize Babylon.js engine and scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    // Create scene
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.05, 0.05, 0.1, 1); // Dark blue-gray background
    sceneRef.current = scene;

    // Create camera with WASD controls
    const camera = new FreeCamera(
      'camera',
      new BVector3(camera3d.position.x, camera3d.position.y, camera3d.position.z),
      scene
    );
    camera.setTarget(new BVector3(camera3d.target.x, camera3d.target.y, camera3d.target.z));
    camera.attachControl(canvasRef.current, true);

    // Configure WASD controls
    camera.keysUp = [87]; // W
    camera.keysDown = [83]; // S
    camera.keysLeft = [65]; // A
    camera.keysRight = [68]; // D
    camera.speed = 0.5;
    camera.angularSensibility = 1000;
    camera.inertia = 0.9;

    // Configure mouse wheel zoom
    camera.inputs.addMouseWheel();

    cameraRef.current = camera;

    // Create ambient light
    const ambientLight = new HemisphericLight(
      'ambientLight',
      new BVector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.6;
    ambientLight.groundColor = new Color3(0.2, 0.2, 0.25);

    // Create directional light (sun)
    const sunLight = new DirectionalLight(
      'sunLight',
      new BVector3(-0.5, -1, 0.5),
      scene
    );
    sunLight.intensity = 0.8;
    sunLight.diffuse = new Color3(1, 0.98, 0.9);

    // Performance optimization: freeze active meshes when scene is static
    // This reduces draw calls when meshes don't change
    scene.autoClear = true;
    scene.autoClearDepthAndStencil = true;

    // Enable performance optimizations
    scene.skipPointerMovePicking = false; // Keep this for hover detection
    scene.blockMaterialDirtyMechanism = false; // Allow material updates for selection highlighting

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
      engineRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [camera3d.position.x, camera3d.position.y, camera3d.position.z, camera3d.target.x, camera3d.target.y, camera3d.target.z]);

  // Freeze/unfreeze active meshes for performance optimization
  // This reduces draw calls when the scene is not actively changing
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Freeze meshes after a short delay to allow initial setup
    const freezeTimeout = setTimeout(() => {
      if (scene && scene.meshes.length > 0) {
        scene.freezeActiveMeshes();
      }
    }, 500);

    return () => {
      clearTimeout(freezeTimeout);
      // Unfreeze when component updates (areas/assets change)
      if (scene) {
        scene.unfreezeActiveMeshes();
      }
    };
  }, [areas.length, assets.length]);

  // Sync camera position to store on change
  useEffect(() => {
    if (!cameraRef.current || !sceneRef.current) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;

    const observer = scene.onAfterRenderObservable.add(() => {
      const pos = camera.position;
      const target = camera.getTarget();

      // Only update if position changed significantly
      const threshold = 0.01;
      if (
        Math.abs(pos.x - camera3d.position.x) > threshold ||
        Math.abs(pos.y - camera3d.position.y) > threshold ||
        Math.abs(pos.z - camera3d.position.z) > threshold
      ) {
        setCameraPosition({ x: pos.x, y: pos.y, z: pos.z });
      }
      if (
        Math.abs(target.x - camera3d.target.x) > threshold ||
        Math.abs(target.y - camera3d.target.y) > threshold ||
        Math.abs(target.z - camera3d.target.z) > threshold
      ) {
        setCameraTarget({ x: target.x, y: target.y, z: target.z });
      }
    });

    return () => {
      scene.onAfterRenderObservable.remove(observer);
    };
  }, [camera3d, setCameraPosition, setCameraTarget]);

  // Handle area hover
  const handleAreaHover = useCallback((id: string | null) => {
    setHoveredId(id);
    onHover?.(id);
  }, [setHoveredId, onHover]);

  // Handle area click
  const handleAreaClick = useCallback((id: string, shiftKey: boolean) => {
    if (shiftKey) {
      addToSelection(id);
    } else {
      select([id]);
    }
  }, [select, addToSelection]);

  if (!lot) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
        <p>No lot defined. Create a project first.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full outline-none"
        tabIndex={0}
      />
      {sceneRef.current && (
        <>
          <Ground scene={sceneRef.current} lot={lot} />
          {areas
            .filter((area) => area.visible)
            .map((area) => (
              <AreaBox
                key={area.id}
                scene={sceneRef.current!}
                area={area}
                isSelected={selectedIds.includes(area.id)}
                onHover={handleAreaHover}
                onClick={handleAreaClick}
              />
            ))}
          {assets
            .filter((asset) => asset.visible)
            .map((asset) => (
              <Asset3D
                key={asset.id}
                scene={sceneRef.current!}
                asset={asset}
                isSelected={selectedIds.includes(asset.id)}
                onHover={handleAreaHover}
                onClick={handleAreaClick}
              />
            ))}
        </>
      )}
    </div>
  );
}
