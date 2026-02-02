import {ConnectionBase, GetSchemes, NodeBase, NodeEditor, Root, Scope,} from "rete";
import {Area2D, AreaExtensions, AreaPlugin} from "rete-area-plugin";

type SelectionPreset = {
    borderColor?: string;
    borderWidth: number;
    backgroundColor: string;
    opacity: number;
};

type NodeScheme = NodeBase & {
    width: number;
    height: number;
};

export type ExpectedSchemes = GetSchemes<NodeScheme, ConnectionBase>;

export class ReteSelectionPlugin<Schemes extends ExpectedSchemes> extends Scope<
    never,
    [Area2D<Schemes>, Root<Schemes>]
> {
    editor!: NodeEditor<Schemes>;
    area!: AreaPlugin<Schemes, Area2D<Schemes>>;
    private selector: ReturnType<typeof AreaExtensions.selector>;
    
    private style: SelectionPreset = {
        backgroundColor: "#4a90d9",
        borderColor: "#4a90d9",
        borderWidth: 2,
        opacity: 30
    };
    private selectedIds = new Set<string>();
    private overlay!: HTMLElement;
    private box!: HTMLElement;

    constructor(selector: ReturnType<typeof AreaExtensions.selector>) {
        super("selection");
        this.selector = selector;
    }

    setParent(scope: Scope<Area2D<Schemes>, [Root<Schemes>]>): void {
        super.setParent(scope);

        this.area = this.parentScope<AreaPlugin<Schemes>>(AreaPlugin);
        this.editor = this.area.parentScope<NodeEditor<Schemes>>(NodeEditor);

        this.setupOverlay();
        this.setupSelection();
        this.setupPipe();
    }

    private setupOverlay(): void {
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

    private setupSelection(): void {
        const container = this.area.container;

        const accumulating = AreaExtensions.accumulateOnCtrl();
        const selectableNodes = AreaExtensions.selectableNodes(
            this.area,
            this.selector,
            {accumulating}
        );

        let origin = {x: 0, y: 0};
        let active = false;

        const updateBox = (clientX: number, clientY: number) => {
            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            this.box.style.left = `${Math.min(origin.x, x)}px`;
            this.box.style.top = `${Math.min(origin.y, y)}px`;
            this.box.style.width = `${Math.abs(x - origin.x)}px`;
            this.box.style.height = `${Math.abs(y - origin.y)}px`;
        };

        const screenToCanvasRect = (
            left: number,
            top: number,
            right: number,
            bottom: number
        ) => {
            const {k, x, y} = this.area.area.transform;
            return {
                left: (left - x) / k,
                top: (top - y) / k,
                right: (right - x) / k,
                bottom: (bottom - y) / k,
            };
        };

        const getNodesInRect = (clientX: number, clientY: number): string[] => {
            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const canvas = screenToCanvasRect(
                Math.min(origin.x, x),
                Math.min(origin.y, y),
                Math.max(origin.x, x),
                Math.max(origin.y, y)
            );

            return this.editor
                .getNodes()
                .filter((node) => {
                    const el = this.area.nodeViews.get(node.id)?.element;
                    if (!el) return false;

                    const nodeRect = el.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const {k, x, y} = this.area.area.transform;

                    const nodeLeft = (nodeRect.left - containerRect.left - x) / k;
                    const nodeTop = (nodeRect.top - containerRect.top - y) / k;
                    const nodeRight = nodeLeft + nodeRect.width / k;
                    const nodeBottom = nodeTop + nodeRect.height / k;

                    return !(
                        nodeRight < canvas.left ||
                        nodeLeft > canvas.right ||
                        nodeBottom < canvas.top ||
                        nodeTop > canvas.bottom
                    );
                })
                .map((n) => n.id);
        };

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;

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

        const onPointerMove = (e: PointerEvent) => {
            if (!active) return;
            updateBox(e.clientX, e.clientY);
        };

        const onPointerUp = (e: PointerEvent) => {
            if (!active) return;
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

    private setupPipe() {
        const selector = AreaExtensions.selector();
        const accumulating = AreaExtensions.accumulateOnCtrl();
        const selectableNodes = AreaExtensions.selectableNodes(
            this.area,
            selector,
            {accumulating}
        );

        this.addPipe((context) => {
            if (!("type" in context)) return context;

            if (context.type === "nodepicked") {
                const pickedId = (context.data as any).id;

                if (this.selectedIds.has(pickedId)) {
                    [...this.selectedIds].forEach((id) =>
                        selectableNodes.select(id, true)
                    );
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

    public addPreset(preset: SelectionPreset) {
        this.style = {
            ...preset
        };
    }
}
