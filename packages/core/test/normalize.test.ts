import { describe, expect, it } from "vitest";

import { normalizePageManifestToIR } from "../src/normalize";

describe("normalizePageManifestToIR", () => {
  it("produces stable normalized output", () => {
    const ir = normalizePageManifestToIR({
      seed: "seed-1234",
      page: {
        pageId: "page-home",
        route: "/",
        title: "Home",
        seo: { title: "Home", description: "Welcome" },
        blocks: [
          {
            instanceId: "",
            blockId: "hero.split.v1",
            props: { heading: "Hello", zzz: true, aaa: false },
            contentRefs: { body: "content-hero" },
            styleOverrides: { color: "primary" },
            visibility: "visible",
          },
        ],
      },
      contentRecords: [
        {
          id: "content-hero",
          type: "text",
          data: { body: "Welcome to Manifold" },
        },
      ],
    });

    expect(ir).toMatchInlineSnapshot(`
      {
        "blocks": [
          {
            "blockId": "hero.split.v1",
            "content": {
              "body": {
                "body": "Welcome to Manifold",
              },
            },
            "instanceId": "90i2kq2u5cdl",
            "props": {
              "aaa": false,
              "heading": "Hello",
              "zzz": true,
            },
            "styles": {
              "color": "primary",
            },
            "visibility": "visible",
          },
        ],
        "pageId": "page-home",
        "route": "/",
        "seo": {
          "description": "Welcome",
          "title": "Home",
        },
      }
    `);
  });
});
