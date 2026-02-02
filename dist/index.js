"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReteSelectionPlugin = void 0;
const rete_1 = require("rete");
const rete_area_plugin_1 = require("rete-area-plugin");
class ReteSelectionPlugin extends rete_1.Scope {
    constructor(selector) {
        super("selection");
        this.style = {
            backgroundColor: "#4a90d9",
            borderColor: "#4a90d9",
            borderWidth: 2,
            opacity: 30
        };
        this.selectedIds = new Set();
        this.selector = selector;
    }
    setParent(scope) {
        super.setParent(scope);
        this.area = this.parentScope(rete_area_plugin_1.AreaPlugin);
        this.editor = this.area.parentScope(rete_1.NodeEditor);
        this.setupOverlay();
        this.setupSelection();
        this.setupPipe();
    }
    setupOverlay() {
        const container = this.area.container;
        this.overlay = document.createElement("div");
        this.overlay.style.cssText = `
                position: absolute;
                inset: 0;
                z-index: 10;
                pointer-events: none;
              `;
        container.appendChild(this.overlay);
        this.box = document.createElement("div");
        this.box.style.cssText = `
                position: absolute;
                background: ${this.style.backgroundColor}${this.style.opacity};
                border: ${this.style.borderWidth}px solid ${this.style.borderColor};
                display: none;
              `;
        this.overlay.appendChild(this.box);
    }
    setupSelection() {
        const container = this.area.container;
        const accumulating = rete_area_plugin_1.AreaExtensions.accumulateOnCtrl();
        const selectableNodes = rete_area_plugin_1.AreaExtensions.selectableNodes(this.area, this.selector, { accumulating });
        let origin = { x: 0, y: 0 };
        let active = false;
        const updateBox = (clientX, clientY) => {
            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            this.box.style.left = `${Math.min(origin.x, x)}px`;
            this.box.style.top = `${Math.min(origin.y, y)}px`;
            this.box.style.width = `${Math.abs(x - origin.x)}px`;
            this.box.style.height = `${Math.abs(y - origin.y)}px`;
        };
        const screenToCanvasRect = (left, top, right, bottom) => {
            const { k, x, y } = this.area.area.transform;
            return {
                left: (left - x) / k,
                top: (top - y) / k,
                right: (right - x) / k,
                bottom: (bottom - y) / k,
            };
        };
        const getNodesInRect = (clientX, clientY) => {
            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const canvas = screenToCanvasRect(Math.min(origin.x, x), Math.min(origin.y, y), Math.max(origin.x, x), Math.max(origin.y, y));
            return this.editor
                .getNodes()
                .filter((node) => {
                var _a;
                const el = (_a = this.area.nodeViews.get(node.id)) === null || _a === void 0 ? void 0 : _a.element;
                if (!el)
                    return false;
                const nodeRect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const { k, x, y } = this.area.area.transform;
                const nodeLeft = (nodeRect.left - containerRect.left - x) / k;
                const nodeTop = (nodeRect.top - containerRect.top - y) / k;
                const nodeRight = nodeLeft + nodeRect.width / k;
                const nodeBottom = nodeTop + nodeRect.height / k;
                return !(nodeRight < canvas.left ||
                    nodeLeft > canvas.right ||
                    nodeBottom < canvas.top ||
                    nodeTop > canvas.bottom);
            })
                .map((n) => n.id);
        };
        const onPointerDown = (e) => {
            if (e.button !== 0)
                return;
            const rect = container.getBoundingClientRect();
            origin = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            active = true;
            this.box.style.display = "block";
            this.box.style.width = "0";
            this.box.style.height = "0";
            this.box.style.left = `${origin.x}px`;
            this.box.style.top = `${origin.y}px`;
        };
        const onPointerMove = (e) => {
            if (!active)
                return;
            updateBox(e.clientX, e.clientY);
        };
        const onPointerUp = (e) => {
            if (!active)
                return;
            active = false;
            this.box.style.display = "none";
            const ids = getNodesInRect(e.clientX, e.clientY);
            if (!accumulating.active()) {
                this.editor.getNodes().forEach((n) => selectableNodes.unselect(n.id));
                this.selectedIds.clear();
            }
            ids.forEach((id) => {
                this.selectedIds.add(id);
                selectableNodes.select(id, true);
            });
        };
        container.addEventListener("pointerdown", onPointerDown);
        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("pointerup", onPointerUp);
    }
    setupPipe() {
        const selector = rete_area_plugin_1.AreaExtensions.selector();
        const accumulating = rete_area_plugin_1.AreaExtensions.accumulateOnCtrl();
        const selectableNodes = rete_area_plugin_1.AreaExtensions.selectableNodes(this.area, selector, { accumulating });
        this.addPipe((context) => {
            if (!("type" in context))
                return context;
            if (context.type === "nodepicked") {
                const pickedId = context.data.id;
                if (this.selectedIds.has(pickedId)) {
                    [...this.selectedIds].forEach((id) => selectableNodes.select(id, true));
                    return context;
                }
                if (!accumulating.active()) {
                    this.selectedIds.clear();
                }
                this.selectedIds.add(pickedId);
            }
            return context;
        });
    }
    addPreset(preset) {
        this.style = Object.assign({}, preset);
    }
}
exports.ReteSelectionPlugin = ReteSelectionPlugin;
