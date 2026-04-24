# 3D AgentOrg Canvas Implementation Plan

## Product Shape

The canvas should behave like an explorable 3D workspace, not a diagram.

The first successful prototype should show:

- A low-poly office or operations floor.
- A CEO/planner station.
- Team zones for Research, Analysis, and Output.
- Agents sitting or standing at desks.
- Tool objects on or near each desk.
- Moving task packets during run mode.
- Trace markers on agents/tools/handoffs after completion.
- Click selection that opens the existing inspector/feedback UI.

## Why Not the Current Renderer

The current canvas maps `OrgSpec` into React Flow nodes and edges in `OrgCanvas.tsx`.

That is useful for validating contracts, but the visual metaphor is wrong for the intended product. It reads as a flowchart, not an AI organization. The new renderer should preserve the data model while replacing the visual mapping.

## Architecture

### Module Layout

Create a new 3D canvas module rather than continuing to patch `canvas-lab`.

```text
frontend/src/features/canvas3d/
  AgentOrgWorld.tsx
  AgentOrgScene.tsx
  world-layout.ts
  world-types.ts
  WorldCameraControls.tsx
  objects/
    OfficeFloor.tsx
    TeamZone.tsx
    AgentDesk.tsx
    AgentAvatar.tsx
    ToolObject.tsx
    WorkPacket.tsx
    TraceMarker.tsx
    OutputStation.tsx
  overlays/
    WorldHud.tsx
    SelectionLabel.tsx
```

Use `AgentOrgWorld.tsx` as the React boundary:

- Accepts `OrgSpec`.
- Accepts `mode`: `design`, `run`, `traces`, `history` or a lab-specific mode.
- Accepts selected object state.
- Emits selection events back to React.
- Keeps inspector and feedback UI outside the canvas.

### Dependency Plan

Install:

```powershell
cd frontend
npm install three @react-three/fiber @react-three/drei
```

Do not add postprocessing or model loaders in the first pass.

## Data Mapping

Map the existing JSON into world objects:

| Org data | 3D representation |
|---|---|
| `OrgSpec` | Whole office/campus world |
| `leadership[]` | CEO office or command desk |
| `teams[]` | Floor zones or rooms |
| `agents[]` | Desk + avatar + status light |
| `tools[]` | Tool objects on desks |
| `workflow[]` | Floor path, floating labels, or timeline rail |
| `edges[]` | Animated packet paths between stations |
| `run.traces[]` | Trace badges, evidence cards, tool-call markers |
| `run.finalOutput` | Output station or final deliverable table |

Do not encode layout in the source org JSON yet. Add a derived `world-layout.ts` function first:

```ts
function buildWorldLayout(org: OrgSpec): WorldLayout
```

The layout function should assign:

- Team zone positions.
- Agent desk positions.
- Tool object positions.
- Handoff path points.
- Camera focus points for selected objects.

## Interaction Model

### Camera

Use Drei `OrbitControls`.

Controls:

- Mouse wheel: zoom.
- Left drag: orbit or pan depending on final feel.
- Right drag or shift-drag: pan.
- Double-click object: focus camera.
- Reset button: return to overview.

Suggested starting camera:

```ts
camera={{ position: [9, 8, 9], fov: 42 }}
```

Orbit constraints:

- Keep polar angle limited so users cannot flip under the floor.
- Enable damping.
- Set min/max distance.
- Target the center of the office floor.

### Selection

Use R3F pointer events on groups/meshes:

```tsx
<group onClick={(event) => {
  event.stopPropagation();
  onSelect({ kind: "agent", id: agent.id });
}}>
```

Selectable objects:

- Agent desk.
- Agent avatar.
- Tool object.
- Team floor zone.
- Work packet.
- Handoff path.
- Output station.

Clicking empty space should clear or preserve selection depending on the workspace mode. For the lab, clearing is useful.

### Feedback

The 3D canvas should not contain form inputs. It should emit a selected target:

```ts
type WorldSelection =
  | { kind: "agent"; id: string }
  | { kind: "team"; id: string }
  | { kind: "tool"; id: string; agentId?: string }
  | { kind: "handoff"; id: string }
  | { kind: "output"; id: "final_output" };
```

The existing React panel renders:

- input received
- actions / tool calls
- output
- feedback composer

## Visual Design Direction

Use a low-poly, readable game style:

- Orthographic or slightly perspective camera.
- Matte materials.
- No realistic textures at first.
- Strong silhouettes.
- Agents as simple stylized workers or robots.
- Desks as box geometry with monitors, keyboards, and tool props.
- Teams as room carpets/zones with subtle dividers.
- Planner station visually distinct from worker desks.
- Output station as a delivery table or terminal.

Avoid:

- Card-like UI in the 3D world.
- Complex imported models in the first pass.
- Heavy postprocessing.
- Many unique materials.
- Tiny unreadable labels.

## Modes

### Creating Org

Show streamed construction:

- Floor appears.
- Planner desk appears.
- Team zones appear.
- Desks pop in one by one.
- Tool objects appear on desks.
- Handoff paths draw in.

Implementation:

- Drive visibility from `visibleIds`, same as current mock flow.
- Use simple scale/fade animations.

### Running Task

Show execution:

- Work packet starts at planner.
- Packet travels to research desks, then analyst, then writer/verifier.
- Active agent glows or has status light.
- Tool objects pulse during tool use.
- Output station fills at completion.

Implementation:

- Use trace events as source of truth.
- Convert active edge/agent/step to animation state.
- Keep animation decorative; do not invent state that is not in trace events.

### Trace + Feedback

Show completed run:

- Trace markers on desks and tools.
- Click agent to inspect its input/actions/output.
- Click tool object to inspect tool calls.
- Click path/handoff to inspect payload.
- Click output station to inspect final output.

Implementation:

- Render persistent badges near objects with traces.
- Use selected target to populate normal React inspector.

## First Prototype Scope

Build one good 3D world, not five variants.

Minimum viable prototype:

1. Install R3F/Drei.
2. Add `/canvas-3d-lab`.
3. Render an office floor with two or three team zones.
4. Render planner + all agents from `OrgSpec`.
5. Render desk, avatar, monitor, and 1-3 tool props per agent.
6. Add `OrbitControls` with zoom and pan.
7. Make agents, teams, tools, and output station clickable.
8. Show selected object in existing inspector panel.
9. Animate one work packet in running mode.
10. Add reset camera and focus-selected controls.

Do not integrate this into `OrgCanvas.tsx` until the lab feels good.

## Follow-Up Prototype Scope

After the first 3D lab feels right:

1. Add camera focus transitions on selection.
2. Add trace markers and handoff path picking.
3. Add streamed creation animation from `CanvasEvent`.
4. Add run animation from `TraceEvent`.
5. Add feedback target creation.
6. Replace the current React Flow canvas in the main workspace behind a feature flag.

## Test And Validation

Required checks before considering it viable:

- `npm run lint`
- `npx tsc --noEmit`
- Browser route loads without WebGL errors.
- Canvas is nonblank.
- Orbit/zoom/pan works.
- Click an agent opens the correct inspector target.
- Click a tool opens the correct tool target.
- Mode switch does not reset selected state unless intentional.
- No text overlaps the canvas controls.

For visual validation, use browser screenshots across:

- Desktop wide.
- Laptop height constrained.
- Mobile or narrow layout if the page will be shown on smaller screens.

## Integration With Phase 1 Backend

The 3D renderer should remain downstream of the same contracts planned in Phase 1:

- `CanvasEvent` builds org state.
- `TraceEvent` drives run and replay state.
- Feedback targets reference contract IDs.
- Persisted InsForge data should replay the exact same scene.

The 3D renderer should not require backend-specific fields. If it needs layout hints later, add optional `viewHints` or generate layout client-side from stable IDs.

## Open Decisions

- Orthographic camera vs perspective camera. Start with perspective; switch to orthographic if readability suffers.
- Raw Three.js vs React Three Fiber. Start with R3F/Drei because it integrates better with existing React state.
- Imported GLB models vs procedural geometry. Start procedural; import assets only after the interaction model works.
- Whether team rooms should be literal walls or floor zones. Start with floor zones to preserve visibility and clickability.

