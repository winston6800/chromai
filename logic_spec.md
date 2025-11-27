# ChromaManga Logic Specification

## 1. Core Data Model
The application relies on a unidirectional data flow centered around the `ProcessedImage` object.

### State Object: `ProcessedImage`
| Property | Type | Description |
|----------|------|-------------|
| `id` | UUID | Unique identifier for the page. |
| `originalUrl` | Base64 String | The raw black-and-white input image. |
| `colorizedUrl` | Base64 String \| null | The output from Gemini or the Manual Editor. |
| `status` | Enum | `idle` -> `processing` -> `completed` \| `error`. |
| `customPrompt`| String | Per-page overrides for the AI. |

## 2. AI Colorization Pipeline (Gemini Service)
The colorization process strictly separates **Content** (Ink) from **Style** (Color).

### Logic Flow
1.  **Input**: User selects B&W image + (Optional) Reference Image + Text Instructions.
2.  **Prompt Engineering**:
    *   **System Instruction**: Defines Persona ("Expert Colorist") and Rules ("Preserve Line Art").
    *   **Context Construction**:
        *   If `ReferenceImage` exists: It is injected as `image/png` (Index 0).
        *   Target Image is injected as `image/png` (Index 1).
        *   Prompt explicitly labels Index 0 as "Source" and Index 1 as "Target" to prevent structure bleeding.
3.  **Execution**: Calls `gemini-3-pro` or `nano-banana-2.5`.
4.  **Output**: Returns a single Base64 image string.

## 3. Manual Editor Logic (Canvas Engine)
The manual editor uses an HTML5 Canvas with a custom coordinate system to handle Zoom, Pan, and Drawing simultaneously.

### Coordinate System Math
To map a mouse click (Screen Space) to a pixel on the image (Canvas Space):

$$
x_{canvas} = \frac{x_{client} - rect.left}{scale}
$$

$$
y_{canvas} = \frac{y_{client} - rect.top}{scale}
$$

*   **Note**: `rect.left` and `rect.top` are derived from `getBoundingClientRect()`, which automatically accounts for the CSS `translate` (Pan) applied to the container.
*   **Scale**: Controlled by a multiplier state (0.1x to 5.0x).

### Brush Stroke Interpolation (The "Smooth Line" Logic)
To prevent disjointed dots when moving the mouse quickly:
1.  **Track**: Store `lastPos {x, y}` on `pointerdown` and `pointermove`.
2.  **Calculate**: On `pointermove`, calculate distance $d$ and angle $\theta$ between `lastPos` and `currentPos`.
3.  **Interpolate**: Loop from $0$ to $d$, stamping the brush tip at:
    $$
    x_{new} = x_{start} + \cos(\theta) \cdot i
    $$
    $$
    y_{new} = y_{start} + \sin(\theta) \cdot i
    $$

### Tool Logic & Visual Feedback
*   **Brush (Round)**:
    *   **Cursor**: `crosshair`
    *   **Action**: Draws a circle via `ctx.arc`.
    *   **Composite Operation**: `source-over` (Adds color on top).
    *   **Math**: Radius = $size / 2$.
*   **Eraser**:
    *   **Cursor**: `crosshair` (or custom square).
    *   **Action**: Removes pixel data (Circular shape).
    *   **Composite Operation**: `destination-out` (Makes pixels transparent).
*   **Paint Bucket (Flood Fill)**:
    *   **Cursor**: `alias` / `crosshair`.
    *   **Algorithm**: Stack-based 4-way recursive fill.
    *   **Tolerance**: Calculates Euclidean color distance. If $Distance(target, current) < Threshold$, replace color.
*   **Pan**:
    *   **Cursor**: `grab` (idle) / `grabbing` (active).
    *   **Action**: Updates `pan {x, y}` state, translating the CSS of the wrapper div.
*   **Picker**:
    *   **Cursor**: `crosshair` (or custom pipette).
    *   **Action**: Reads `ctx.getImageData(x, y, 1, 1)` and updates `color` state.

## 4. History Stack (Undo Logic)
*   **Structure**: Array of `ImageData` objects.
*   **Snapshot**: `ctx.getImageData(0, 0, width, height)` is pushed to the array on `pointerup` (end of stroke).
*   **Restore**: `ctx.putImageData(lastSnapshot)` restores the pixel grid.
*   **Limit**: Stack size capped at 10 to manage memory.

## 5. Input Event Handling
*   **Keyboard Shortcuts**:
    *   `Ctrl + Z` / `Cmd + Z`: Triggers Undo function.
*   **Mouse Wheel**:
    *   **Action**: Zooms in/out relative to current scale.
    *   **Math**: $scale_{new} = scale_{old} - (event.deltaY \times 0.001)$
    *   **Constraints**: Clamped between 0.1x and 5.0x.