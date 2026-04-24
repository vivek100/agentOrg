# AgentOrg 3D Builder Reference

This folder collects the research and implementation plan for replacing the current flat flowchart-style org canvas with an explorable 3D organization world.

## Goal

Build a canvas where an AgentOrg feels like a small operating company or command room:

- Teams are rooms, pods, or zones.
- Agents are visible workers at desks or stations.
- Tools are objects near agents.
- Work packets move through the org during a run.
- Traces are inspectable by clicking agents, tools, handoffs, team zones, or output stations.
- Feedback can be attached directly to the selected object.
- The world is zoomable, pannable, orbitable, and clickable.

## Relevant Local Files

- `frontend/src/features/canvas/OrgCanvas.tsx` - current React Flow renderer.
- `frontend/src/app/canvas-lab/page.tsx` - current canvas ideation lab.
- `frontend/src/features/workspace/types.ts` - current mock org/run/trace contracts.
- `frontend/src/features/workspace/mock-data.ts` - current sample org data.
- `docs/prompts/canvas_ideation_prompt.md` - original multi-variant canvas prompt.
- `docs/handoff/phase_1_integration_handoff.md` - post-prototype Phase 1 backend integration handoff.

## Planning Docs In This Folder

- `implementation_plan.md` - module-level plan for building the 3D canvas.
- `visual_model.md` - visual language for org, team, agent, tools, resources, run traces, and feedback.

## Research Sources

### Official Three.js

- Three.js docs: https://threejs.org/docs/
- Three.js manual: https://threejs.org/manual/
- OrbitControls: https://threejs.org/docs/pages/OrbitControls.html
- Raycaster: https://threejs.org/docs/pages/Raycaster.html
- DragControls: https://threejs.org/docs/pages/DragControls.html
- Picking manual: https://threejs.org/manual/en/picking.html

### React Three Fiber

- React Three Fiber docs: https://r3f.docs.pmnd.rs/
- R3F events: https://r3f.docs.pmnd.rs/api/events
- Drei docs: https://drei.docs.pmnd.rs/

### Installed Skill

Installed skill:

```text
~/.agents/skills/threejs-game
```

Important patterns from the skill:

- Start with one scene, one camera, one interaction loop.
- Prefer simple materials and low draw calls.
- Use an event-driven architecture for game/world interactions.
- Keep constants centralized.
- Cap pixel ratio to avoid GPU overload.
- Use `renderer.setAnimationLoop()` in raw Three.js. With React Three Fiber, this maps to R3F's render loop.
- Avoid postprocessing and shadows in the first pass.
- Dispose resources properly if using raw Three.js.

## Recommended Technical Direction

Use React Three Fiber and Drei inside the existing Next.js frontend.

Recommended packages:

```text
three
@react-three/fiber
@react-three/drei
```

Reasoning:

- React Three Fiber keeps the scene declarative and tied to React state.
- R3F pointer events remove most manual `Raycaster` plumbing.
- Drei gives `OrbitControls`, `Html`, `Text`, and useful helpers.
- The existing inspector, feedback UI, tabs, versions, and mode selectors can remain normal React.

Avoid raw Three.js for the first product implementation unless R3F compatibility becomes a blocker.
