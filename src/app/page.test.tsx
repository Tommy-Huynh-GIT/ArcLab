import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

describe("Home", () => {
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            profiles: [
              { id: "profile_1", name: "Maya", handedness: "LEFT" },
              { id: "profile_2", name: "Jordan", handedness: "RIGHT" },
            ],
          }),
      }),
    );

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:profile-upload-preview"),
    });
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("clears the selected upload when switching profiles", async () => {
    render(<Home />);

    fireEvent.click(await screen.findByRole("button", { name: /maya/i }));
    fireEvent.change(screen.getByLabelText(/free throw clip/i), {
      target: {
        files: [
          new File(["video"], "maya-free-throw.webm", {
            type: "video/webm",
          }),
        ],
      },
    });

    expect(screen.getByText("maya-free-throw.webm")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/selected free throw preview/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /jordan/i }));

    expect(screen.queryByText("maya-free-throw.webm")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/selected free throw preview/i),
    ).not.toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:profile-upload-preview");
  });
});
