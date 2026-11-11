import { describe, expect, it } from "vitest";
import { emptyDraft, kindFromPath, paragraphs, partnerDraftSchema, postDraftSchema, publishIssues, slugSchema } from "../src/content.js";

describe("content contracts", () => {
  it("requires both languages before publishing", () => {
    const draft = { ...emptyDraft("partner"), title: { ar: "شريك", en: "" } };
    expect(publishIssues("partner", draft)).toEqual({ "title.en": ["required"], url: ["required"] });
    const post = { ...emptyDraft("post"), location: { ar: "الرياض", en: " " } };
    expect(publishIssues("post", post)).toMatchObject({ "location.en": ["required"], date: ["required"] });
  });

  it("accepts only https links and clean addresses", () => {
    expect(partnerDraftSchema.safeParse({ ...emptyDraft("partner"), url: "http://x.example" }).success).toBe(false);
    expect(partnerDraftSchema.safeParse({ ...emptyDraft("partner"), url: "https://x.example/a" }).success).toBe(true);
    expect(slugSchema.parse(" Motion-Challenges ")).toBe("motion-challenges");
    expect(slugSchema.safeParse("a--b").success).toBe(false);
    expect(postDraftSchema.safeParse({ ...emptyDraft("post"), date: "2026-02-30" }).success).toBe(false);
  });

  it("maps route segments and splits paragraphs on blank lines", () => {
    expect(kindFromPath("projects")).toBe("project");
    expect(kindFromPath("users")).toBeNull();
    expect(paragraphs("One\n\n\n Two \n  \nThree")).toEqual(["One", "Two", "Three"]);
  });
});

describe("page sections and images", () => {
  it("validates each section by its own fields", async () => {
    const { sectionDraftSchema, emptySection, publishIssues, mediaIds, emptyDraft } = await import("../src/content.js");
    expect(sectionDraftSchema.safeParse({ ...emptySection("hero"), intro: { ar: "", en: "" } }).success).toBe(false);
    expect(publishIssues("section", emptySection("policy-privacy"))).toEqual({ "body.ar": ["required"], "body.en": ["required"] });
    const vision = { ...emptySection("vision"), vision: { ar: "رؤية", en: "Vision" }, mission: { ar: "", en: "Mission" } };
    expect(publishIssues("section", vision)).toEqual({ "mission.ar": ["required"] });
    const post = { ...emptyDraft("post"), image: { id: "0123456789abcdef01234567", alt: { ar: "", en: "x" }, width: 10, height: 10, crop: { x: 0, y: 0, w: 1, h: 1 } } };
    expect(publishIssues("post", post)["image.alt.ar"]).toEqual(["required"]);
    expect(mediaIds(post)).toEqual(["0123456789abcdef01234567"]);
  });
});

describe("crops and references", () => {
  it("keeps a crop inside the picture and finds images in stored data of any shape", async () => {
    const { cropSchema, referencedMediaIds } = await import("../src/content.js");
    expect(cropSchema.safeParse({ x: 0.5, y: 0, w: 0.6, h: 1 }).success).toBe(false);
    expect(cropSchema.safeParse({ x: 0.25, y: 0.1, w: 0.5, h: 0.5 }).success).toBe(true);
    expect(cropSchema.safeParse({ x: 0, y: 0, w: 0.001, h: 1 }).success).toBe(false);
    const a = "0123456789abcdef01234567";
    expect(referencedMediaIds({ members: [{ portrait: { id: a } }, null, {}], logo: { id: "../x" } })).toEqual([a]);
    expect(referencedMediaIds(null)).toEqual([]);
  });
});
