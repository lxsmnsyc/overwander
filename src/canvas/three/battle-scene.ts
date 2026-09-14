import { Camera, Scene, WebGLRenderer } from 'three';
import { type FieldView, fieldClipDepth, fieldClipMatrix, fieldLens } from '../battle/field';
import EffectBatch from './effect-batch';
import SceneMarks from './scene-marks';

/**
 * The battlefield as a three.js scene.
 *
 * The camera is the field's own projection rather than one placed to
 * look like it, so a mesh set down in field units lands where the flat
 * pictures of the fight put the same spot. The floor, the pokemon and
 * what is written around them go in as marks, each given the depth of
 * the ground it stands on.
 */
export interface BattleScene {
  /** The flat pictures, written in the drawing's own coordinates */
  readonly marks: SceneMarks;
  /** Move effects, written in field units */
  readonly effects: EffectBatch;
  /** Size the scene to its element, point the camera and open the marks for a frame */
  look: (
    view: FieldView,
    stage: { scale: number; offsetX: number; offsetY: number },
    screen: { width: number; height: number },
    ratio: number,
  ) => void;
  /** How near the viewer a thing is at a perspective scale, for a mark standing there */
  depthOf: (scale: number) => number;
  draw: () => void;
  dispose: () => void;
}

/** The scene, or null where the browser will not give a WebGL context */
export default function createBattleScene(canvas: HTMLCanvasElement): BattleScene | null {
  let renderer: WebGLRenderer;

  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false });
  } catch {
    return null;
  }
  // Clear to nothing, so the field colour behind the element shows
  // wherever the floor does not reach
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new Camera();
  const marks = new SceneMarks();
  const effects = new EffectBatch();
  const sized = { width: 0, height: 0, ratio: 0 };

  camera.matrixAutoUpdate = false;
  for (const sheet of marks.meshes) {
    scene.add(sheet);
  }
  // After the weather on the glass, as the painted effects always were
  effects.mesh.renderOrder = 4;
  scene.add(effects.mesh);

  return {
    marks,
    effects,
    look: (view, stage, screen, ratio): void => {
      if (sized.width !== screen.width || sized.height !== screen.height || sized.ratio !== ratio) {
        renderer.setPixelRatio(ratio);
        renderer.setSize(screen.width, screen.height, false);
        sized.width = screen.width;
        sized.height = screen.height;
        sized.ratio = ratio;
      }
      const matrix = fieldClipMatrix(view, stage, screen);

      // Written row by row, and three.js reads a flat array a column at a time
      camera.projectionMatrix.fromArray(matrix).transpose();
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      marks.begin(screen.width, screen.height);
      effects.begin(matrix, fieldLens(view, stage), screen, view.yaw);
    },
    depthOf: fieldClipDepth,
    draw: (): void => {
      marks.end();
      effects.end();
      renderer.render(scene, camera);
    },
    dispose: (): void => {
      marks.dispose();
      effects.dispose();
      renderer.dispose();
      // Browsers cap live contexts, and dispose alone leaves this one held until collected
      renderer.forceContextLoss();
    },
  };
}
