# Verification

## Automated checks completed

- 19 built-in Node tests: loader skips, cached/failed assets, timing and dismissal, reduced motion, quality policies, responsive logo geometry, overscroll bounds, component explosion/reassembly and finite scene/camera targets.
- Seven simulated-DOM tests: removal of internal/duplicate content; five unique public services; complete translations and RTL switching; service inquiry mapping; mobile navigation; brief creation/editing; privacy dialog; visible pointer following; hover state; touch/reduced-motion behavior; two GSAP scrubbed pins; service navigation; removal/recreation of pinning; optional library/GPU failure; data saving; IDs, anchors and local resources.
- Real bundled Three.js geometry and GSAP execute in the integration harness. A mock renderer captures scene state: 60 components separate and reassemble, mesh coordinates remain finite, and the contact camera moves from beyond the front portal to inside the ring sequence.
- Application JavaScript syntax and active HTML/CSS resource references checked.
- Original logo and retained image bytes compared with the source ZIP.

## What these checks do not establish

The integration harness simulates DOM geometry and uses a mock GPU. It does not verify actual browser layout, pin spacing, GPU appearance, frame rate, physical touch gestures or screenshot appearance. Supported browser-control tooling was unavailable in this environment.

Before public deployment, review desktop and mobile in English and Arabic. Check the horizontal service sequence, keyboard access to the numbered navigation and dialogs, assembly animation, cursor effects, native scrolling, pause/reduced motion and the final Instagram handoff.
