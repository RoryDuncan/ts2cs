/**
 * Decorator transformation utilities
 *
 * Transforms TypeScript decorators to C# attributes.
 * Handles Godot-specific decorators like @export, @onready, @rpc.
 */

import { Decorator, Node } from "ts-morph";

/**
 * Known Godot decorator mappings
 * Keys are PascalCase since TypeScript doesn't allow reserved keywords as decorator names
 */
const GODOT_DECORATOR_MAPPINGS: Record<string, string> = {
    Export: "Export",
    Onready: "", // @Onready is handled specially (skipped, logic in _Ready)
    Rpc: "Rpc",
    Signal: "Signal",
    Tool: "Tool",
    Icon: "Icon",
    GlobalClass: "GlobalClass"
};

/**
 * Transpile a decorator to a C# attribute
 */
export function transpileDecorator(decorator: Decorator, indent = "    "): string | null {
    // Get decorator name from the call expression or identifier
    const callExpr = decorator.getCallExpression();
    const name = callExpr
        ? callExpr.getExpression().getText()
        : decorator.getExpression().getText();

    // Get arguments if it's a call expression
    const args = callExpr ? callExpr.getArguments() : [];

    // Handle Godot-specific decorators
    const mappedName = GODOT_DECORATOR_MAPPINGS[name];

    // Skip decorators that have no C# equivalent
    if (mappedName === "") {
        return null;
    }

    // Use mapped name or PascalCase the original
    const attrName = mappedName ?? toPascalCase(name);

    // Handle @ExportRange, @ExportEnum, etc. (PascalCase versions of export hints)
    if (name.startsWith("Export") && name !== "Export") {
        return transpileExportHintDecorator(name, args, indent);
    }

    // Handle @Rpc with arguments
    if (name === "Rpc" && args.length > 0) {
        return transpileRpcDecorator(args, indent);
    }

    // Simple decorator without arguments
    if (args.length === 0) {
        return `${indent}[${attrName}]`;
    }

    // Decorator with arguments
    const argList = args.map((arg) => arg.getText()).join(", ");
    return `${indent}[${attrName}(${argList})]`;
}

/**
 * Transpile export hint decorators (@ExportRange, @ExportEnum, etc.)
 */
function transpileExportHintDecorator(name: string, args: Node[], indent: string): string {
    // Extract hint type from PascalCase name (ExportRange -> Range)
    const hintType = name.replace("Export", "").toLowerCase();
    const argValues = args.map((arg) => arg.getText());

    switch (hintType) {
        case "range":
            // @ExportRange(0, 100) -> [Export(PropertyHint.Range, "0,100")]
            return `${indent}[Export(PropertyHint.Range, "${argValues.join(",")}")]`;

        case "enum":
            // @ExportEnum("Option1", "Option2") -> [Export(PropertyHint.Enum, "Option1,Option2")]
            const enumValues = argValues.map((v) => v.replace(/['"]/g, "")).join(",");
            return `${indent}[Export(PropertyHint.Enum, "${enumValues}")]`;

        case "file":
            // @ExportFile("*.png") -> [Export(PropertyHint.File, "*.png")]
            return `${indent}[Export(PropertyHint.File, ${argValues[0] ?? '""'})]`;

        case "dir":
            // @ExportDir -> [Export(PropertyHint.Dir)]
            return `${indent}[Export(PropertyHint.Dir)]`;

        case "multiline":
            // @ExportMultiline -> [Export(PropertyHint.MultilineText)]
            return `${indent}[Export(PropertyHint.MultilineText)]`;

        case "placeholder":
            // @ExportPlaceholder("Enter name") -> [Export(PropertyHint.PlaceholderText, "Enter name")]
            return `${indent}[Export(PropertyHint.PlaceholderText, ${argValues[0] ?? '""'})]`;

        case "colornoalpha":
            // @ExportColorNoAlpha -> [Export(PropertyHint.ColorNoAlpha)]
            return `${indent}[Export(PropertyHint.ColorNoAlpha)]`;

        case "nodepath":
            // @ExportNodePath("Node2D") -> [Export(PropertyHint.NodePathValidTypes, "Node2D")]
            return `${indent}[Export(PropertyHint.NodePathValidTypes, ${argValues[0] ?? '""'})]`;

        case "flags":
            // @ExportFlags("Fire", "Water") -> [Export(PropertyHint.Flags, "Fire,Water")]
            const flagValues = argValues.map((v) => v.replace(/['"]/g, "")).join(",");
            return `${indent}[Export(PropertyHint.Flags, "${flagValues}")]`;

        default:
            // Unknown hint type, just use basic Export
            return `${indent}[Export]`;
    }
}

/**
 * Transpile @rpc decorator with arguments
 */
function transpileRpcDecorator(args: Node[], indent: string): string {
    const argTexts = args.map((arg) => arg.getText().replace(/['"]/g, ""));

    const parts: string[] = [];

    for (const arg of argTexts) {
        switch (arg) {
            case "any_peer":
                parts.push("MultiplayerApi.RpcMode.AnyPeer");
                break;
            case "authority":
                parts.push("MultiplayerApi.RpcMode.Authority");
                break;
            case "call_local":
                parts.push("CallLocal = true");
                break;
            case "call_remote":
                parts.push("CallLocal = false");
                break;
            case "reliable":
                parts.push("TransferMode = MultiplayerPeer.TransferModeEnum.Reliable");
                break;
            case "unreliable":
                parts.push("TransferMode = MultiplayerPeer.TransferModeEnum.Unreliable");
                break;
            case "unreliable_ordered":
                parts.push("TransferMode = MultiplayerPeer.TransferModeEnum.UnreliableOrdered");
                break;
            default:
                // Unknown argument, pass through
                parts.push(arg);
        }
    }

    return `${indent}[Rpc(${parts.join(", ")})]`;
}

/**
 * Transpile all decorators from a node
 */
export function transpileDecorators(decorators: Decorator[], indent = "    "): string[] {
    const result: string[] = [];

    for (const decorator of decorators) {
        const attr = transpileDecorator(decorator, indent);
        if (attr !== null) {
            result.push(attr);
        }
    }

    return result;
}

/**
 * Simple PascalCase converter
 */
function toPascalCase(str: string): string {
    return str
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("");
}

