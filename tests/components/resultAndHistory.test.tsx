import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { ToastProvider } from "@/components/feedback/Toast";
import { HistoryView } from "@/features/history/components/HistoryView";
import { WelcomeBack } from "@/features/landing/components/WelcomeBack";
import { DeterministicResetPlanner } from "@/features/reset/planner";
import { ResultView } from "@/features/reset/components/ResultView";
import { LocalLoadRepository, LocalResetRepository } from "@/services/persistence";
import type { ResetRecord } from "@/types/reset";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/account/actions", () => ({ updateProfileLocale: vi.fn(async () => {}) }));

function wrap(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ToastProvider>{ui}</ToastProvider>
    </NextIntlClientProvider>,
  );
}

async function seedReset(id = "r1", overwhelm = 8): Promise<ResetRecord> {
  const answers = { overwhelm, areas: ["kids" as const, "money" as const], time: "1to2h" as const, moneyPressure: true, mustHappen: "Pay the bill\nCall school" };
  const record: ResetRecord = {
    id,
    createdAt: new Date().toISOString(),
    locale: "en",
    answers,
    plan: new DeterministicResetPlanner().plan(answers),
    safetyFlag: false,
  };
  await new LocalResetRepository(window.localStorage).save(record);
  return record;
}

describe("result page: ticking, focus mode and add to load", () => {
  it("ticks today items and persists them", async () => {
    const user = userEvent.setup();
    await seedReset();
    wrap(<ResultView id="r1" />);
    await screen.findByText("Pay the bill");

    const done = screen.getAllByRole("button", { name: en.result.today.markDone });
    await user.click(done[0]);
    await waitFor(async () => {
      const saved = await new LocalResetRepository(window.localStorage).get("r1");
      expect(saved?.completedItemIds).toHaveLength(1);
    });
    expect(screen.getByText("Pay the bill")).toHaveClass("line-through");
  });

  it("walks through focus mode one item at a time", async () => {
    const user = userEvent.setup();
    const record = await seedReset("r2");
    wrap(<ResultView id="r2" />);
    await screen.findByText("Pay the bill");

    await user.click(screen.getByRole("button", { name: en.result.today.focus }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Pay the bill")).toBeInTheDocument();
    expect(within(dialog).queryByText("Call school")).not.toBeInTheDocument();

    for (let i = 0; i < record.plan.today.length; i++) {
      await user.click(within(dialog).getByRole("button", { name: en.focus.done }));
    }
    expect(await within(dialog).findByText(en.focus.allDone.title)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: en.focus.allDone.cta }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(en.result.today.allDone)).toBeInTheDocument();
  });

  it("adds a this-week item to Family Load in the matching area", async () => {
    const user = userEvent.setup();
    await seedReset("r3");
    wrap(<ResultView id="r3" />);
    await screen.findByText("Pay the bill");

    const buttons = screen.getAllByRole("button", { name: en.result.addToLoad });
    await user.click(buttons[0]);
    await waitFor(async () => {
      const items = await new LocalLoadRepository(window.localStorage).list();
      expect(items).toHaveLength(1);
      expect(items[0].category).toBe("kids");
      expect(items[0].title).toBe(en.planner.week.area.kids);
    });
    expect(await screen.findByText(en.result.addedShort)).toBeInTheDocument();
  });
});

describe("history and welcome back", () => {
  it("lists resets with overwhelm, areas and deletion", async () => {
    const user = userEvent.setup();
    await seedReset("h1", 3);
    await seedReset("h2", 9);
    wrap(<HistoryView />);
    expect(await screen.findByText("2 resets so far.")).toBeInTheDocument();
    expect(screen.getAllByText(/Overwhelm \d out of 10/)).toHaveLength(2);
    expect(screen.getByText(en.history.trend.needMore)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: en.history.delete })[0]);
    await waitFor(() => expect(screen.getByText("1 reset so far.")).toBeInTheDocument());
    expect(await new LocalResetRepository(window.localStorage).list()).toHaveLength(1);
  });

  it("shows nothing for first-time visitors and a hub for returning ones", async () => {
    const { unmount } = wrap(<WelcomeBack />);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText(en.home.welcome.cta)).not.toBeInTheDocument();
    unmount();

    await seedReset("w1", 6);
    wrap(<WelcomeBack />);
    expect(await screen.findByText(en.home.welcome.todayDone)).toBeInTheDocument();
    expect(screen.getByText(en.home.welcome.ctaAgain)).toBeInTheDocument();
    expect(screen.getByText("Nothing open right now")).toBeInTheDocument();
  });
});
