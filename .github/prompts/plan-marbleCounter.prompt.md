A vanilla web site for counting the number of marbles in an image.
Allows a user to upload an image. The marbles are assumed
to be of a solid color, all the same size, and the background
is a solid color as well (different from the marble colors).
The algorithm should count how many marbles of each color there are,
and display the result in a legend; optionally, at the request of
the user, provide a bounding box for each marble as evidence of 
the count.

## Plan: Marble Counter Web App

TL;DR - implement a vanilla web app per README: image upload, color-based marble detection, per-color counts, optional bounding boxes in UI.

**Steps**
1. Initialize repository structure (if missing): index.html, styles.css, script.js, and optionally tests/.
2. Implement UI in index.html:
   - file input and preview image
   - input controls for algorithm parameters (granularity, min blob size, show bounding boxes)
   - results area for legend and count display
3. Implement image loading in script.js:
   - draw uploaded image to canvas
   - optionally downscale for performance
4. Implement core image processing algorithm in script.js:
   - sample image pixels and cluster by color (RGB quantization, K-means or bucket-based adjacent merge)
   - identify background color by largest cluster or user-provided selection
   - filter non-background pixels
   - connected-component labeling (CCL) on remaining pixel mask to locate marble blobs
   - compute for each blob: centroid, bounding box, average color
   - cluster blobs by color to produce per-color marble counts
5. Present output:
   - per color count legend
   - optional bounding boxes overlaid on canvas when toggle enabled
6. Add user narrative and manual tests in README and run instructions.
7. Add automated tests (if time): unit tests for color quantization, CCL, color grouping (e.g., Jest or plain script).

**Verification**
1. Manual test with a few synthetic images:
   - 1-color marbles on contrasting background
   - multi-color marbles with background
   - overlapping marbles to ensure component separation behavior is defined
2. Verify counts match expected and bounding boxes appear correctly when enabled
3. If tests added, run `npm test` (or `node test.js`) and confirm passing

**Decisions**
- Use client-side JS/Canvas only (no backend), consistent with "vanilla web site" statement.
- Background detected automatically by largest color region; user parameter allowed if ambiguous.
- Bounding boxes included per request.

**Further Considerations**
1. If performance becomes an issue, add an option for downsampling a max resolution and then rescaling boxes.
2. For robustness vs gradient backgrounds, note this is out of scope but can be added later with edge detection.
