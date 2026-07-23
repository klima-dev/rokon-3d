# Models

Put `.glb` / `.gltf` model files here and load them with the `loadModel()` helper
(`src/lib/loadModel.js`), e.g. from `src/main.js`:

```js
import { loadModel } from './lib/loadModel.js';
loadModel('assets/models/chair.glb', { position: [20, 0, 30], scale: 1, rotationY: Math.PI });
```

Keep files **local** (served same-origin) so the scene stays fully offline —
don't load models from remote URLs. Coordinates are in feet (1 unit = 1 ft), so
use `scale` to convert a model's own units into feet. Models land in the
toggleable `G.models` group.
