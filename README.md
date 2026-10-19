# Programming Worlds — public website & cinematic motion

This revision edits the supplied HTML/CSS/JavaScript project. It keeps the original PW logo, brand artwork, Arabic/English switch, service detail dialogs and local project-brief workflow.

## Open

Extract the complete ZIP and open `index.html`. For HTTP preview, run `python3 -m http.server 8080` in this folder and visit `http://localhost:8080`. No build step, Node runtime or CDN connection is needed by the website. All animation libraries and assets are included.

## Public content

Five page sections: Home, Services, Approach, About and Contact.

- All website copy has been rewritten for prospective clients in English and Arabic.
- Each service appears once: websites, mobile applications, custom software, NFC/QR menus and e-commerce.
- Removed the campaign/gallery, future-service expansion cards, strategic roadmap, long company profile, internal content strategy, academy announcement, duplicate concept portfolio and repeated promotional blocks.
- No invented customer projects, statistics, testimonials or live AI/ERP offerings.
- Instagram: `@programming_worlds`.

Removed campaign scripts, thumbnails and campaign-kit exports are also omitted from this delivery. Your original uploaded ZIP retains those materials.

## Experience

The persistent Three.js world changes composition throughout the page, instead of occupying one isolated demonstration section:

1. **Home:** moving perspective, orbital geometry, pointer-responsive camera/light, and separate scroll depth for the background, logo and typography.
2. **Services:** desktop GSAP ScrollTrigger pinning moves five service panels horizontally. CSS 3D illustrations tilt, turn and move in depth. Numbered navigation and previous/next controls provide an alternative to scrolling.
3. **Approach:** a second scroll-scrubbed sequence separates 60 geometric pieces, rotates them around a core, changes camera distance and reassembles them. Copy highlights follow the sequence.
4. **About:** dimensional logo parallax and progressive copy reveals.
5. **Contact:** the camera moves through a series of portal rings behind the closing message.

Fine-pointer interactions include a visible glowing cursor companion, a trailing ring and particles, hover expansion, click feedback, magnetic buttons, object tilt and cursor-responsive lighting. The native system pointer remains visible. Decorative cursor elements do not intercept clicks.

## Responsive and fallback behavior

- Long pinned sequences require a viewport wider than 1100px and at least 760px tall, full-quality mode and available GSAP/ScrollTrigger.
- On mobile, with reduced motion or while effects are paused, service panels stack vertically and all content remains accessible.
- WebGL failure retains the original logo, CSS 3D illustrations and an assembly fallback.
- Data saving skips WebGL. Low-resource profiles reduce quality and avoid continuous drawing.
- Rendering pauses in hidden tabs; WebGL pixel ratio is capped. Sustained slow frames downgrade quality.
- “Pause effects” is available throughout the page. OS reduced-motion and pointer-type changes are handled live.
- The project form prepares text locally. It does not automatically submit or save leads; visitors send their brief through Instagram themselves.

## Source map

- `index.html`: complete public page, service panels and dialogs.
- `site-content.js`: Arabic translations and bilingual service detail data.
- `script.js`: language, navigation, dialogs and brief preparation.
- `styles.css`: retained brand, base components and responsive rules.
- `cinematic.css`: updated public layouts, 3D staging, cursor effects and accessibility modes.
- `experience.js`: coordinated application animation loop, GSAP pin timelines, cursor response and motion controls.
- `world-engine.js`: Three.js geometry, lighting, scene transitions, camera movement and context recovery.
- `motion-core.js`: deterministic layout/quality/camera helpers.
- `vendor/`: pinned Three.js, GSAP and ScrollTrigger, with original license notices.

## Verification

26 automated tests passed: 19 dependency-free tests and seven simulated-DOM integration tests. JavaScript syntax, resource paths and original logo bytes were checked.

Run `node --test tests/experience.test.cjs`. For integration tests, install jsdom 26 outside the deployable folder and run `NODE_PATH=/path/to/node_modules node --test tests/site-integration.test.cjs`.

Supported browser-control tooling was unavailable. Real-browser layout, screenshots, GPU performance and physical touch-device behavior have not been visually verified. See `VERIFICATION.md` for the scope of completed checks. This ZIP does not deploy changes to an existing hosted website.
