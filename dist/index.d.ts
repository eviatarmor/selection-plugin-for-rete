import { ConnectionBase, GetSchemes, NodeBase, NodeEditor, Root, Scope } from "rete";
import { Area2D, AreaExtensions, AreaPlugin } from "rete-area-plugin";
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
export declare class ReteSelectionPlugin<Schemes extends ExpectedSchemes> extends Scope<never, [
    Area2D<Schemes>,
    Root<Schemes>
]> {
    editor: NodeEditor<Schemes>;
    area: AreaPlugin<Schemes, Area2D<Schemes>>;
    private selector;
    private style;
    private selectedIds;
    private overlay;
    private box;
    constructor(selector: ReturnType<typeof AreaExtensions.selector>);
    setParent(scope: Scope<Area2D<Schemes>, [Root<Schemes>]>): void;
    private setupOverlay;
    private setupSelection;
    private setupPipe;
    addPreset(preset: SelectionPreset): void;
}
export {};
