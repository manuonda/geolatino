import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const { isAdminEmail, parseAdminEmails } = await import("./admin");

describe("parseAdminEmails", () => {
  it("separa por coma, recorta espacios y pasa a minúscula", () => {
    expect(parseAdminEmails(" Ana@Mail.com, ,beto@mail.com ")).toEqual(["ana@mail.com", "beto@mail.com"]);
  });

  it("sin variable no hay admins", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
  });
});

describe("isAdminEmail", () => {
  it("compara sin importar mayúsculas", () => {
    expect(isAdminEmail("ANA@mail.com", "ana@mail.com")).toBe(true);
  });

  it("rechaza emails que no están y la ausencia de email", () => {
    expect(isAdminEmail("otro@mail.com", "ana@mail.com")).toBe(false);
    expect(isAdminEmail(null, "ana@mail.com")).toBe(false);
    expect(isAdminEmail("", "")).toBe(false);
  });
});
