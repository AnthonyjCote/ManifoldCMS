import crypto from "node:crypto";

export function deterministicInstanceId(input: {
  pageId: string;
  blockId: string;
  insertionIndex: number;
  seed: string;
}): string {
  const hash = crypto
    .createHash("sha1")
    .update(`${input.pageId}:${input.blockId}:${input.insertionIndex}:${input.seed}`)
    .digest("hex");

  const asBase36 = BigInt(`0x${hash}`).toString(36);
  return asBase36.slice(0, 12);
}
