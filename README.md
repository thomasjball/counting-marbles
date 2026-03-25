A vanilla web site for counting the number of marbles in an image.
Allows a user to upload an image. The marbles are assumed
to be of a solid color, all the same size, and the background
is a solid color as well (different from the marble colors).
The algorithm should count how many marbles of each color there are,
and display the result in a legend; optionally, at the request of
the user, provide a bounding box for each marble as evidence of 
the count.

## Optional improvements (implemented)

1. Manual background picker is available: click “Pick background from image” and click any pixel on the rendered image.
2. Manual background color selector is available with a checkbox `Use manual background color`.
3. Export results as CSV or JSON.
4. Confidence output now shows area consistency (mean + std dev) for detected marbles, assisting calibration.

## Additional future enhancements

5. Implement a stronger color clustering strategy (k-means or DBSCAN in RGB/HSL) for robust multi-color marble scenes.
6. Support overlapping marbles with watershed segmentation or circle detection (Hough transform).
7. Add image upload history and results export (already partially implemented; could be expanded).
8. Add automated test coverage for the core pixel mask + connected components pipeline using Jest or Node script.
9. Add mobile-friendly UI improvements with pinch zoom and gestures for large images.

