/* Shared cross-element registries. These are single array instances imported by
   every element module, so `push` from anywhere lands in the same list.

   clickable      — meshes the raycaster can select (need userData: {color, name,
                    dim, area, details, baseOpacity}). See lib/builders.makeClickable.
   labelRegistry  — every CSS2D text tag, so the master "Labels" toggle can hide
                    them all at once while each still respects its own group. */
export const clickable = [];
export const labelRegistry = [];
