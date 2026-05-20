import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePicker } from "./ProfilePicker";

describe("ProfilePicker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists existing profiles and selects one", async () => {
    const onSelect = vi.fn();
    const profile = { id: "profile_1", name: "Maya", handedness: "LEFT" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ profiles: [profile] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProfilePicker onSelect={onSelect} />);

    fireEvent.click(await screen.findByRole("button", { name: /maya/i }));

    expect(onSelect).toHaveBeenCalledWith(profile);
  });

  it("creates a profile and selects the created profile", async () => {
    const onSelect = vi.fn();
    const createdProfile = {
      id: "profile_2",
      name: "Jordan",
      handedness: "LEFT",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ profiles: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ profile: createdProfile }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProfilePicker onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText(/player name/i), {
      target: { value: "Jordan" },
    });
    fireEvent.change(screen.getByLabelText(/handedness/i), {
      target: { value: "LEFT" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(createdProfile));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jordan", handedness: "LEFT" }),
    });
  });

  it("shows the API error when profile creation is rejected", async () => {
    const onSelect = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ profiles: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "Profile name must be at least 2 characters.",
          }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProfilePicker onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(
      await screen.findByText("Profile name must be at least 2 characters."),
    ).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a fallback error when profile creation returns invalid JSON", async () => {
    const onSelect = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ profiles: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("bad json")),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProfilePicker onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText(/player name/i), {
      target: { value: "Jordan" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(
      await screen.findByText("Unable to create profile."),
    ).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a fallback error when profile creation returns no valid profile", async () => {
    const onSelect = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ profiles: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ profile: { id: "profile_3" } }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProfilePicker onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText(/player name/i), {
      target: { value: "Jordan" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(
      await screen.findByText("Unable to create profile."),
    ).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a fallback error when profile creation cannot reach the API", async () => {
    const onSelect = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ profiles: [] }),
      })
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    render(<ProfilePicker onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText(/player name/i), {
      target: { value: "Jordan" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(
      await screen.findByText("Unable to create profile."),
    ).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
