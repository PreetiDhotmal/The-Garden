import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  OctahedronGeometry,
  SphereGeometry,
} from "three";

// SymbolShape (used by both SymbolTotem and SwitchPost) — three fixed
// symbol shapes, never varying in size, shared across every instance.
export const SYMBOL_SPHERE_GEOMETRY = new SphereGeometry(0.35, 24, 24);
export const SYMBOL_BOX_GEOMETRY = new BoxGeometry(0.55, 0.55, 0.55);
export const SYMBOL_CONE_GEOMETRY = new ConeGeometry(0.4, 0.7, 4);

// Post bases — each component's own base dimensions kept distinct
// (not unified) to avoid any visual change; only de-duplicated across
// the multiple simultaneous instances of the SAME component.
export const TOTEM_BASE_GEOMETRY = new CylinderGeometry(0.2, 0.25, 0.6, 8);
export const SWITCH_BASE_GEOMETRY = new CylinderGeometry(0.22, 0.28, 0.6, 8);
export const MIRROR_BASE_GEOMETRY = new CylinderGeometry(0.18, 0.22, 0.6, 8);
export const DIGIT_BASE_GEOMETRY = new CylinderGeometry(0.22, 0.28, 0.6, 8);
export const CRYSTAL_BASE_GEOMETRY = new CylinderGeometry(0.3, 0.4, 0.5, 6);

// Component-specific shapes.
export const MIRROR_PANE_GEOMETRY = new BoxGeometry(1.1, 1.1, 0.08);
export const DIGIT_FACE_GEOMETRY = new BoxGeometry(0.6, 0.6, 0.2);
export const CRYSTAL_GEOMETRY = new OctahedronGeometry(0.5, 0);
