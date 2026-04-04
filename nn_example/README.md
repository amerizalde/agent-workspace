# Neural Network Abstraction Demo (p5.js)

This is a small, educational browser simulation that explains neural networks as
an abstraction inspired by the brain.

Live Example -> [Here](https://amerizalde.github.io/agent-workspace/)

## What this demonstrates

- Brain scale reference: about 10^11 neurons and 10^15 links (estimated).
- The animation uses a tiny sampled graph to teach the idea of connected units
  and signal propagation.
- It is intentionally not a literal rendering of biological brain scale.

## Controls

- Mouse: click near a neuron to stimulate it.
- Keyboard:
  - 1 = perception mode
  - 2 = cognition mode
  - 3 = learning mode
  - Space = pause/resume
  - O = toggle overlay panel
  - H = toggle help text
  - R = reset the sampled network

## Run locally

1. Open the `nn_example` folder in any static file server.
2. Serve it with one of these options:

```bash
# Python 3
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy

You can deploy this as a static site on GitHub Pages, Netlify, Vercel Static,
or any basic web host.

Required files:

- `index.html`
- `style.css`
- `sketch.js`

No build step is required.
