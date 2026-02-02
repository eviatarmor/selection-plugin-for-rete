# selection-plugin-for-rete

A drag-to-select box selection plugin for [Rete.js](https://retejs.org) v2.

## Install

```bash
npm install rete-selection-plugin
```

## Peer Dependencies

Make sure you have these installed in your project:

```bash
npm install rete rete-area-plugin
```

## Usage

```typescript
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin } from "rete-area-plugin";
import { ReteSelectionPlugin } from "@eviatar/rete-selection-plugin";

class MyNode extends ClassicPreset.Node {
    width = 200;
    height = 150;

    constructor(label: string) {
        super(label);
    }
}

type Schemes = GetSchemes<MyNode, ClassicPreset.Connection>;

const editor = new NodeEditor<Schemes>();
const area = new AreaPlugin<Schemes>(container);

const selection = new ReteSelectionPlugin<Schemes>(AreaExtensions.selector());

editor.use(area);
area.use(selection);
```

## Custom Styling

All style options are optional. Defaults to a blue selection box.

```typescript
selection.addPreset({
  backgroundColor: "#4a90d9", 
  borderColor: "#4a90d9",     
  borderWidth: 2,             
  opacity: 60
});
```

## How It Works

- **Drag to select** — click and drag on the canvas to draw a selection box around nodes.
- **Ctrl + click** — hold Ctrl while dragging or clicking to accumulate selections without clearing previously selected nodes.
- **Group drag** — picking any node within an existing selection will move the entire group.
