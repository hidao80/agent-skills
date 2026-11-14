---
name: make-social-preview
description: |
  Create a social preview image (social-preview.svg) for the repository. Use when asked to create a GitHub social preview, OGP image, or social media card image.
  Trigger examples: "Make a social preview image", "Generate a social preview image", "Update the social preview image"
---

# make-social-preview Skill Details

Create social-preview.svg. The size is 1280×640. Obtain the content (repository name and description) from the README and similar files.

- Use Twemoji vectors for emoji. Fetch the SVGs from `jdecked/twemoji` on jsDelivr and embed the paths inline rather than referencing them externally (to prevent them from going missing when rasterized).
- GitHub social previews and OGP do not support SVG, so also export a PNG of the same size. If no conversion method is available, tell the user so.
