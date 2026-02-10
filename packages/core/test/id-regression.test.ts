import { describe, expect, it } from "vitest";

import { normalizePageManifestToIR } from "../src/normalize";

describe("instanceId stability", () => {
  it("does not regenerate IDs when blocks are reordered", () => {
    const first = normalizePageManifestToIR({
      seed: "seed-1234",
      page: {
        pageId: "page-home",
        route: "/",
        title: "Home",
        seo: {},
        blocks: [
          {
            instanceId: "id-a",
            blockId: "hero.split.v1",
            props: {},
            contentRefs: {},
            styleOverrides: {},
            visibility: "visible",
          },
          {
            instanceId: "id-b",
            blockId: "cta.banner.v1",
            props: {},
            contentRefs: {},
            styleOverrides: {},
            visibility: "visible",
          },
        ],
      },
      contentRecords: [],
    });

    const reordered = normalizePageManifestToIR({
      seed: "seed-1234",
      page: {
        pageId: "page-home",
        route: "/",
        title: "Home",
        seo: {},
        blocks: [
          {
            instanceId: "id-b",
            blockId: "cta.banner.v1",
            props: {},
            contentRefs: {},
            styleOverrides: {},
            visibility: "visible",
          },
          {
            instanceId: "id-a",
            blockId: "hero.split.v1",
            props: {},
            contentRefs: {},
            styleOverrides: {},
            visibility: "visible",
          },
        ],
      },
      contentRecords: [],
    });

    expect(first.blocks.map((block) => block.instanceId).sort()).toEqual(
      reordered.blocks.map((block) => block.instanceId).sort()
    );
  });
});
