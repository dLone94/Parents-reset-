import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { ToastProvider } from "@/components/feedback/Toast";
import { EveningClose } from "@/features/evening/components/EveningClose";
import { KeptView } from "@/features/kept/components/KeptView";
import { VentScreen } from "@/features/vent/components/VentScreen";
import { LocalDayNoteRepository, LOCAL_DAY_NOTES_KEY } from "@/services/persistence";
import { localDay } from "@/lib/utils/day";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/evening",
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function wrap(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ToastProvider>{ui}</ToastProvider>
    </NextIntlClientProvider>,
  );
}

const E = en.evening;
const V = en.vent;

describe("evening close", () => {
  it("closes a day with nothing but the weather", async () => {
    const user = userEvent.setup();
    wrap(<EveningClose />);

    await user.click(await screen.findByRole("radio", { name: E.weather.options.storm }));
    await user.click(screen.getByRole("button", { name: E.save }));

    // A storm with nothing written gets the storm ending, not a habit compliment.
    expect(await screen.findByText(E.closing.storm.title)).toBeInTheDocument();

    const stored = new LocalDayNoteRepository(window.localStorage);
    const note = await stored.getByDay(localDay());
    expect(note?.weather).toBe("storm");
    expect(note?.hard).toBeUndefined();
  });

  it("saves what was kept and answers with the kept ending", async () => {
    const user = userEvent.setup();
    wrap(<EveningClose />);

    const kept = await screen.findByRole("textbox", { name: new RegExp(E.kept.label) });
    await user.type(kept, "She read to her brother.");
    await user.click(screen.getByRole("button", { name: E.save }));

    expect(await screen.findByText(E.closing.kept.title)).toBeInTheDocument();
    const note = await new LocalDayNoteRepository(window.localStorage).getByDay(localDay());
    expect(note?.kept).toBe("She read to her brother.");
  });

  it("shows tomorrow's one thing back after closing, and can be edited again", async () => {
    const user = userEvent.setup();
    wrap(<EveningClose />);

    const tomorrow = await screen.findByRole("textbox", { name: new RegExp(E.tomorrow.label) });
    await user.type(tomorrow, "Call the dentist.");
    await user.click(screen.getByRole("button", { name: E.save }));

    expect(await screen.findByText(E.closed.tomorrowLabel)).toBeInTheDocument();
    expect(screen.getByText("Call the dentist.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: E.closed.edit }));
    expect(await screen.findByDisplayValue("Call the dentist.")).toBeInTheDocument();
    // Editing an existing day offers to save changes, not to close it twice.
    expect(screen.getByRole("button", { name: E.saveAgain })).toBeInTheDocument();
  });

  it("reopens an already closed day with its answers filled in", async () => {
    const repo = new LocalDayNoteRepository(window.localStorage);
    await repo.save({
      id: "existing",
      day: localDay(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      locale: "en",
      weather: "sun",
      hard: "The school run.",
    });

    wrap(<EveningClose />);
    expect(await screen.findByDisplayValue("The school run.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: E.weather.options.sun })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

describe("kept", () => {
  it("lists kept moments and surfaces an older one", async () => {
    const old = "2026-01-05";
    window.localStorage.setItem(
      LOCAL_DAY_NOTES_KEY,
      JSON.stringify([
        {
          id: "a",
          day: old,
          createdAt: `${old}T20:00:00.000Z`,
          updatedAt: `${old}T20:00:00.000Z`,
          locale: "en",
          kept: "He fell asleep holding my finger.",
        },
      ]),
    );

    wrap(<KeptView />);
    await waitFor(() =>
      expect(screen.getAllByText("He fell asleep holding my finger.").length).toBeGreaterThan(0),
    );
  });

  it("explains itself when nothing has been kept yet", async () => {
    wrap(<KeptView />);
    expect(await screen.findByText(en.kept.empty.body)).toBeInTheDocument();
  });
});

describe("say it here", () => {
  it("clears the text and stores absolutely nothing", async () => {
    const user = userEvent.setup();
    wrap(<VentScreen />);

    const box = screen.getByRole("textbox", { name: V.label });
    await user.type(box, "I am so angry I could scream.");
    await user.click(screen.getByRole("button", { name: V.tear }));

    expect(await screen.findByText(V.gone.title)).toBeInTheDocument();
    // The whole promise of this screen: nothing written here is persisted.
    const dump = JSON.stringify(window.localStorage) + JSON.stringify(window.sessionStorage);
    expect(dump).not.toContain("angry");
  });

  it("keeps the tear button out of reach until something is written", () => {
    wrap(<VentScreen />);
    expect(screen.getByRole("button", { name: V.tear })).toBeDisabled();
  });
});
