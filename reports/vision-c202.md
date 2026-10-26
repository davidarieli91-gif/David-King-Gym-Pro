# c202 — Z-Anatomy audit + optional skeleton layer

## Audit: current model vs full Z-Anatomy

### What is already in the app

`models/muscular-system-v1.glb`:

- **361 meshes / 694 nodes / 816,286 triangles / 25 materials**, 3.37 MB.
- Includes superficial **and deep** muscles: face, masticators, tongue, larynx,
  extra-ocular muscles, neck, intrinsic back, pelvic floor, psoas, hands and
  feet, plus tendons/fasciae.
- The 231 atlas list entries are grouped muscle bases, not a missing set of
  muscles. The model is an optimized/decimated derivative of the full muscular
  system.

### What the full Z-Anatomy template contains

`Z-Anatomy.zip` → `Startup.blend` (306.8 MB) was downloaded from the official
repository and inspected with Blender 5.2:

- **7,184 objects / 4,569 meshes / 3.66M polygons**.
- Nine system collections:
  - Skeletal system — 1,244 meshes / 577,870 polys
  - Muscular insertions — 705 meshes / 59,339 polys
  - Joints — 480 meshes / 133,965 polys
  - Muscular system — 789 meshes / 2,045,745 polys
  - Cardiovascular — 60 meshes / 54,606 polys
  - Nervous system & sense organs — 460 meshes / 595,504 polys
  - Visceral systems — 254 meshes / 66,413 polys
  - Lymphoid organs — 220 meshes / 80,137 polys
  - Regions — 343 objects
- No skin layer is included.
- The full muscular collection contains duplicate `.l/.ol/.or/.r` variants
  used by the atlas' display modes; the current app has a cleaned subset.
  **The missing sensation was therefore mostly the skeleton/whole-body
  context, not an absent muscle list.**

## What was added

- Exported the **full Z-Anatomy skeletal system** from the same Blender file:
  - joined bones, no annotation label, decimated to 0.3;
  - **179,554 triangles / 460 KB GLB**, Draco;
  - normalized in the same app coordinate system as the muscle body (1.7 m,
    feet at y=0, both bounds aligned exactly in a test scene).
- New **Skeleton** toggle in the 3D atlas dock (EN/RU/HE):
  - loads lazily on first use, with a loading label and retry logic;
  - prefetched in the background after the muscle body is ready;
  - when active, muscles become **red translucent ghost tissue** and the
    skeleton becomes fully visible through them (not the grey x-ray ghost);
  - selected muscles stay opaque; x-ray/isolate/hide/front/back/reset still
    work;
  - HUD shows `MUSCLES` / `SKELETON OVERLAY`.
- The model credit now names the skeleton overlay. License/attribution updated
  in `models/LICENSE-atlas.md` (Z-Anatomy CC BY-SA 4.0, BodyParts3D
  CC BY-SA 2.1 JP).
- No replacement of the accepted muscle model; the skeleton is an optional
  second layer.

## Build / verification

- Build **c202**, SW cache **dk-gym-v229**.
- **60 test files — 0 failures** (new `test-c202.cjs` checks the GLB structure,
  bone material, lazy loader, UI/ghost logic, translations, credit and build).
- Skeleton GLB validated as a single joined Draco mesh with the bone material.
- Desktop and mobile toggles verified; the skeleton file and muscle file share
  the same normalized bounds.
- Skeleton download is ~460 KB and is prefetched only after the muscle model
  has loaded; it is not required for the default muscle-only view.
