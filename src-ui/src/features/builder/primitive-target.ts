export function encodePrimitiveTarget(blockId: string, primitivePath: string): string {
  return `${blockId}::${primitivePath}`;
}

export function decodePrimitiveTarget(target: string): { blockId: string; primitivePath: string } {
  const separatorIndex = target.indexOf("::");
  if (separatorIndex < 0) {
    return { blockId: "", primitivePath: target };
  }
  return {
    blockId: target.slice(0, separatorIndex),
    primitivePath: target.slice(separatorIndex + 2),
  };
}
