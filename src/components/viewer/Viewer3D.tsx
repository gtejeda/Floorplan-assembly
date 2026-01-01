import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3 as BVector3,
  HemisphericLight,
  DirectionalLight,
  Color3,
  Color4,
  PointerEventTypes,
} from '@babylonjs/core';
import { useFloorplanStore } from '@store/index';
import { Ground } from './Ground';
import { AreaBox } from './AreaBox';

// Drag state interface
interface DragState {
  areaId: string;
  meshName: string;
  startX: number;       // Original area X position
  startY: number;       // Original area Y position
  startBaseHeight: number; // Original baseHeight
  offsetX: number;      // Offset from click point to area position (X)
  offsetZ: number;      // Offset from click point to area position (Z)
  startMouseY: number;  // Starting mouse Y for vertical drag
  isVerticalDrag: boolean; // True if Ctrl+Shift (vertical mode)
}

interface Viewer3DProps {
  onHover?: (id: string | null) => void;
  onAreaCreate?: (x: number, y: number) => void;
}

export function Viewer3D({ onHover, onAreaCreate }: Viewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);

  // State to trigger re-render when scene is ready
  const [sceneReady, setSceneReady] = useState(false);

  // Drag state for moving areas
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Store state
  const project = useFloorplanStore((state) => state.project);
  const selectedIds = useFloorplanStore((state) => state.selectedIds);
  const camera3d = useFloorplanStore((state) => state.camera3d);
  const activeTool = useFloorplanStore((state) => state.activeTool);
  const setCameraPosition = useFloorplanStore((state) => state.setCameraPosition);
  const setCameraTarget = useFloorplanStore((state) => state.setCameraTarget);
  const setHoveredId = useFloorplanStore((state) => state.setHoveredId);
  const select = useFloorplanStore((state) => state.select);
  const addToSelection = useFloorplanStore((state) => state.addToSelection);
  const clearSelection = useFloorplanStore((state) => state.clearSelection);
  const updateArea = useFloorplanStore((state) => state.updateArea);

  const lot = project?.lot;
  const rawAreas = project?.areas;

  // Use useMemo to avoid creating new arrays on every render
  const areas = useMemo(() => rawAreas ?? [], [rawAreas]);

  // Calculate camera parameters based on lot size
  const getCameraParams = useCallback(() => {
    if (!lot) {
      return {
        target: new BVector3(25, 0, 15),
        radius: 60,
        alpha: -Math.PI / 2, // Horizontal angle (looking from front)
        beta: Math.PI / 3,   // Vertical angle (45 degrees from top)
      };
    }

    // Center target on lot
    const lotCenterX = lot.width / 2;
    const lotCenterZ = lot.height / 2;
    const maxDimension = Math.max(lot.width, lot.height);
    const radius = maxDimension * 1.2; // Distance from target

    return {
      target: new BVector3(lotCenterX, 0, lotCenterZ),
      radius,
      alpha: -Math.PI / 2, // Looking from front
      beta: Math.PI / 3,   // ~60 degrees from vertical (looking down at angle)
    };
  }, [lot]);

  // Initialize Babylon.js engine and scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const cameraParams = getCameraParams();

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

    // Create ArcRotateCamera - orbits around target point
    const camera = new ArcRotateCamera(
      'camera',
      cameraParams.alpha,  // Horizontal rotation
      cameraParams.beta,   // Vertical rotation
      cameraParams.radius, // Distance from target
      cameraParams.target, // Target point to orbit around
      scene
    );
    camera.attachControl(canvasRef.current, true);

    // Configure camera limits and behavior
    camera.lowerBetaLimit = 0.1;           // Don't go below ground
    camera.upperBetaLimit = Math.PI / 2.1; // Don't go fully horizontal
    camera.lowerRadiusLimit = 5;           // Minimum zoom
    camera.upperRadiusLimit = 500;         // Maximum zoom out
    camera.wheelPrecision = 10;            // Scroll zoom sensitivity (higher = slower)
    camera.panningSensibility = 100;       // Right-click pan sensitivity
    camera.inertia = 0.7;                  // Smooth movement

    // Enable panning with right-click
    camera.panningInertia = 0.7;

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

    // Mark scene as ready to trigger re-render
    setSceneReady(true);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      setSceneReady(false);
      scene.dispose();
      engine.dispose();
      engineRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCameraParams]); // Re-run when lot changes to reposition camera

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
  }, [areas.length]);

  // Sync camera state to store on change (only when scene is ready)
  // For ArcRotateCamera we track alpha, beta, radius and target
  useEffect(() => {
    if (!sceneReady || !cameraRef.current || !sceneRef.current) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Track last synced values to reduce store updates
    let lastAlpha = camera.alpha;
    let lastBeta = camera.beta;
    let lastRadius = camera.radius;
    let lastTarget = camera.target.clone();

    const observer = scene.onAfterRenderObservable.add(() => {
      const threshold = 0.05;
      const positionChanged =
        Math.abs(camera.alpha - lastAlpha) > threshold ||
        Math.abs(camera.beta - lastBeta) > threshold ||
        Math.abs(camera.radius - lastRadius) > threshold;

      const targetChanged =
        Math.abs(camera.target.x - lastTarget.x) > threshold ||
        Math.abs(camera.target.y - lastTarget.y) > threshold ||
        Math.abs(camera.target.z - lastTarget.z) > threshold;

      if (positionChanged) {
        lastAlpha = camera.alpha;
        lastBeta = camera.beta;
        lastRadius = camera.radius;
        // Store the actual position for persistence
        const pos = camera.position;
        setCameraPosition({ x: pos.x, y: pos.y, z: pos.z });
      }

      if (targetChanged) {
        lastTarget = camera.target.clone();
        const target = camera.target;
        setCameraTarget({ x: target.x, y: target.y, z: target.z });
      }
    });

    return () => {
      scene.onAfterRenderObservable.remove(observer);
    };
  }, [sceneReady, setCameraPosition, setCameraTarget]);

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

  // Store refs for drag handling (avoid re-running effect on every change)
  const areasRef = useRef(areas);
  const lotRef = useRef(lot);
  areasRef.current = areas;
  lotRef.current = lot;

  // Handle pointer events for area creation, selection, and dragging
  useEffect(() => {
    if (!sceneReady || !sceneRef.current || !cameraRef.current || !canvasRef.current) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const canvas = canvasRef.current;

    // Helper to get ground intersection point
    const getGroundPoint = (): { x: number; z: number } | null => {
      const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, null, camera);
      if (Math.abs(ray.direction.y) < 0.0001) return null;

      const t = -ray.origin.y / ray.direction.y;
      if (t < 0) return null;

      return {
        x: ray.origin.x + t * ray.direction.x,
        z: ray.origin.z + t * ray.direction.z,
      };
    };

    let shiftPressed = false;
    let ctrlPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressed = true;
      if (e.key === 'Control') ctrlPressed = true;

      // R key - rotate selected areas by 90°
      if ((e.key === 'r' || e.key === 'R') && !e.repeat) {
        selectedIds.forEach((id) => {
          const area = areasRef.current.find((a) => a.id === id);
          if (area && !area.locked) {
            const currentRotation = area.rotation ?? 0;
            const newRotation = (currentRotation + 90) % 360;
            updateArea(id, { rotation: newRotation });
          }
        });
      }
    };

    const endDrag = () => {
      if (dragStateRef.current) {
        // Save final position to store
        const mesh = scene.getMeshByName(dragStateRef.current.meshName);
        if (mesh) {
          const area = areasRef.current.find((a) => a.id === dragStateRef.current!.areaId);
          if (area) {
            if (dragStateRef.current.isVerticalDrag) {
              // Calculate baseHeight from mesh Y position
              const boxHeight = area.elevation === 0 ? 0.1 : Math.abs(area.elevation);
              const newBaseHeight = Math.max(0, mesh.position.y - boxHeight / 2);
              updateArea(dragStateRef.current.areaId, { baseHeight: newBaseHeight });
            } else {
              const newX = mesh.position.x - area.width / 2;
              const newY = mesh.position.z - area.height / 2;
              updateArea(dragStateRef.current.areaId, { x: newX, y: newY });
            }
          }
        }
        dragStateRef.current = null;
        setIsDragging(false);
        camera.attachControl(canvas, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftPressed = false;
        endDrag();
      }
      if (e.key === 'Control') {
        ctrlPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const onPointerDown = (evt: PointerEvent) => {
      if (evt.button !== 0) return;

      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (!pickResult?.hit || !pickResult.pickedMesh) {
        if (activeTool === 'select') clearSelection();
        return;
      }

      const mesh = pickResult.pickedMesh;

      // Ground click
      if (mesh.name === 'ground' || mesh.name === 'grid') {
        if (activeTool === 'area' && onAreaCreate && pickResult.pickedPoint) {
          onAreaCreate(Math.max(0, pickResult.pickedPoint.x), Math.max(0, pickResult.pickedPoint.z));
        } else if (activeTool === 'select') {
          clearSelection();
        }
        return;
      }

      // Area click
      if (mesh.name.startsWith('area-') && activeTool === 'select') {
        const areaId = mesh.name.replace('area-', '');
        const area = areasRef.current.find((a) => a.id === areaId);

        if (area) {
          if (!selectedIds.includes(areaId)) {
            select([areaId]);
          }

          if (shiftPressed && !area.locked) {
            const groundPoint = getGroundPoint();
            if (groundPoint) {
              const isVertical = ctrlPressed;
              dragStateRef.current = {
                areaId,
                meshName: mesh.name,
                startX: area.x,
                startY: area.y,
                startBaseHeight: area.baseHeight ?? 0,
                offsetX: area.x - groundPoint.x,
                offsetZ: area.y - groundPoint.z,
                startMouseY: scene.pointerY,
                isVerticalDrag: isVertical,
              };
              camera.detachControl();
              setIsDragging(true);
            }
          }
        }
      }
    };

    const onPointerUp = () => {
      endDrag();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);

    // Smooth dragging - directly update mesh position (bypasses React)
    const renderObserver = scene.onBeforeRenderObservable.add(() => {
      if (!dragStateRef.current || !shiftPressed) return;

      const { meshName, offsetX, offsetZ, startMouseY, startBaseHeight, isVerticalDrag } = dragStateRef.current;
      const mesh = scene.getMeshByName(meshName);
      if (!mesh) return;

      const area = areasRef.current.find((a) => a.id === dragStateRef.current!.areaId);
      if (!area) return;

      if (isVerticalDrag) {
        // Vertical drag mode: move up/down based on mouse Y movement
        // Moving mouse up (decreasing Y) increases height
        const deltaY = startMouseY - scene.pointerY;
        const sensitivity = 0.05; // Adjust sensitivity for vertical movement
        const newBaseHeight = Math.max(0, startBaseHeight + deltaY * sensitivity);

        // Update mesh Y position
        const boxHeight = area.elevation === 0 ? 0.1 : Math.abs(area.elevation);
        mesh.position.y = newBaseHeight + boxHeight / 2;
      } else {
        // Horizontal drag mode
        const groundPoint = getGroundPoint();
        if (!groundPoint) return;

        // Calculate new corner position
        let newX = groundPoint.x + offsetX;
        let newY = groundPoint.z + offsetZ;

        // Clamp to lot bounds
        const currentLot = lotRef.current;
        if (currentLot) {
          newX = Math.max(0, Math.min(newX, currentLot.width - area.width));
          newY = Math.max(0, Math.min(newY, currentLot.height - area.height));
        } else {
          newX = Math.max(0, newX);
          newY = Math.max(0, newY);
        }

        // Directly update mesh position (smooth, no React re-renders)
        mesh.position.x = newX + area.width / 2;
        mesh.position.z = newY + area.height / 2;
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      scene.onBeforeRenderObservable.remove(renderObserver);

      if (dragStateRef.current) {
        camera.attachControl(canvas, true);
        dragStateRef.current = null;
      }
    };
  }, [sceneReady, activeTool, onAreaCreate, clearSelection, selectedIds, select, updateArea]);

  if (!lot) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
        <p>No lot defined. Create a project first.</p>
      </div>
    );
  }

  // Determine cursor based on state
  const cursor = isDragging ? 'grabbing' : (activeTool === 'area' ? 'crosshair' : 'default');

  return (
    <div className="absolute inset-0" style={{ cursor }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full outline-none"
        tabIndex={0}
      />
      {sceneReady && sceneRef.current && (
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
        </>
      )}
    </div>
  );
}
