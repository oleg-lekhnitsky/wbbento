# Car photo generation

Generate each final scene directly from the original angle reference in `data/car-references.json`. Never use an already generated campaign photo as the base for another generative pass.

Set composition, vehicle size, crop clearance, lighting, background and subtle grain before generating. If an attempt misses framing or damages branding, reject it and generate a new candidate from the original reference. Do not repair generated candidates with generative zoom-out, outpainting or retouching.

Inspect the wordmark, number 260, livery boundaries, grille, wheels and surface texture before selecting a candidate. Single-pass generation reduces cumulative degradation but does not guarantee exact logo preservation.

Existing `*-v4.png` picker assets were created before this rule and include a second generative framing pass. They have been superseded in the picker by `*-v5.png`, generated directly from the original reference in one pass. Their provenance is recorded in `public/assets/car-scenes/framing-v4-notes.txt`.
