import { ConnectionBase, GetSchemes, NodeBase, NodeEditor, Root, Scope } from "rete";
import { Area2D, AreaPlugin } from "rete-area-plugin";
type SelectionStyle = {
    borderColor?: string;
    borderWidth: number;
    backgroundColor: string;
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
    private style;
    private selectedIds;
    private overlay;
    private box;
    constructor(style?: SelectionStyle);
    setParent(scope: Scope<Area2D<Schemes>, [Root<Schemes>]>): void;
    private setupOverlay;
    private setupSelection;
    private setupPipe;
}
export {};
