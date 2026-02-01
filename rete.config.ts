import {ReteOptions} from "rete-cli";

export default <ReteOptions>{
    input: 'src/index.ts',
    name: 'ReteSelectionPlugin',
    globals: {
        'rete': 'Rete',
        'rete-selection-plugin': 'ReteSelectionPlugin'
    }
}
