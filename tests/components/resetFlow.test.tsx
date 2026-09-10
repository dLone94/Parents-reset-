import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import de from "../../messages/de.json";
import { DeterministicResetPlanner } from "@/features/reset/planner";
import { resetAnswersSchema } from "@/features/reset/schema";
import { __resetDraftStoreForTests } from "@/features/reset/useResetDraft";
import { mergeMessages } from "@/i18n/messages";
import { LocalResetRepository } from "@/services/persistence";

const push = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push }),
  usePathname: () => "/reset",
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// The server action is exercised through the same schema + planner it uses.
vi.mock("@/features/reset/actions", () => ({
  submitReset: vi.fn(async (input: unknown) => {
    const parsed = resetAnswersSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };
    return {
      ok: true,
      answers: parsed.data,
      plan: new DeterministicResetPlanner().plan(parsed.data),
      safetyFlag: false,
    };
  }),
}));

import { ResetFlow } from "@/features/reset/components/ResetFlow";
import { ResultView } from "@/features/reset/components/ResultView";

function wrap(ui: React.ReactElement, locale = "en", messages: typeof en = en) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  push.mockClear();
  window.sessionStorage.clear();
  __resetDraftStoreForTests();
});

describe("guest reset flow", () => {
  it("walks through all six questions and saves the plan on this device", async () => {
    const user = userEvent.setup();
    wrap(<ResetFlow />);

    // 1. overwhelm
    expect(screen.getByRole("heading", { name: en.reset.questions.overwhelmed.title })).toBeInTheDocument();
    const cont = () => screen.getByRole("button", { name: en.common.continue });
    expect(cont()).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "8" }));
    await user.click(cont());

    // 2. areas (multi-select)
    await user.click(screen.getByRole("button", { name: en.reset.questions.areas.options.kids }));
    await user.click(screen.getByRole("button", { name: en.reset.questions.areas.options.money }));
    expect(screen.getByRole("button", { name: en.reset.questions.areas.options.kids })).toHaveAttribute("aria-pressed", "true");
    await user.click(cont());

    // 3. time
    await user.click(screen.getByRole("radio", { name: en.reset.questions.time.options["30to60"] }));
    await user.click(cont());

    // 4. money
    await user.click(screen.getByRole("radio", { name: en.reset.questions.money.yes }));
    await user.click(cont());

    // 5. must happen (required)
    expect(cont()).toBeDisabled();
    await user.type(screen.getByRole("textbox"), "Pay the electricity bill{enter}Call the dentist");
    await user.click(cont());

    // 6. on mind (optional) -> submit
    await user.type(screen.getByRole("textbox"), "Birthday party still not sorted");
    await user.click(screen.getByRole("button", { name: en.reset.submit }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    const url = push.mock.calls[0][0] as string;
    expect(url).toMatch(/^\/reset\/[\w-]+$/);

    const id = url.split("/").pop() as string;
    const saved = await new LocalResetRepository(window.localStorage).get(id);
    expect(saved).not.toBeNull();
    expect(saved?.answers.overwhelm).toBe(8);
    expect(saved?.plan.today.map((i) => i.text ?? i.messageKey)).toEqual([
      "Pay the electricity bill",
      "Call the dentist",
      "today.moneyCheck",
    ]);
    // Draft is cleared after a successful submit.
    expect(window.sessionStorage.getItem("parent-reset:draft:v1")).toBeNull();
  });

  it("keeps a draft in sessionStorage so an interruption does not lose answers", async () => {
    const user = userEvent.setup();
    const { unmount } = wrap(<ResetFlow />);
    await user.click(screen.getByRole("radio", { name: "5" }));
    await user.click(screen.getByRole("button", { name: en.common.continue }));
    unmount();

    __resetDraftStoreForTests();
    wrap(<ResetFlow />);
    expect(screen.getByRole("heading", { name: en.reset.questions.areas.title })).toBeInTheDocument();
    expect(screen.getByText(en.reset.resumeDraft)).toBeInTheDocument();
  });

  it("renders long German labels in full", async () => {
    const user = userEvent.setup();
    const messages = mergeMessages(en, de) as typeof en;
    wrap(<ResetFlow />, "de", messages);
    expect(screen.getByRole("heading", { name: messages.reset.questions.overwhelmed.title })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "3" }));
    await user.click(screen.getByRole("button", { name: messages.common.continue }));
    for (const label of Object.values(messages.reset.questions.areas.options)) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });
});

describe("result view", () => {
  it("renders the saved plan with localised planner text and shows a not-found state otherwise", async () => {
    const repo = new LocalResetRepository(window.localStorage);
    const answers = {
      overwhelm: 9,
      areas: ["home" as const],
      time: "1to2h" as const,
      moneyPressure: false,
      mustHappen: "電気代を払う",
    };
    await repo.save({
      id: "abc",
      createdAt: new Date(Date.UTC(2026, 4, 1, 12)).toISOString(),
      locale: "en",
      answers,
      plan: new DeterministicResetPlanner().plan(answers),
      safetyFlag: false,
    });

    wrap(<ResultView id="abc" />);
    expect(await screen.findByText("電気代を払う")).toBeInTheDocument();
    expect(screen.getByText(en.planner.summary.heavy)).toBeInTheDocument();
    expect(screen.getByText(en.planner.today.breather)).toBeInTheDocument();
    expect(screen.getByText(en.planner.letGo.homePerfect)).toBeInTheDocument();
    expect(screen.getByText(en.result.dateLabel.replace("{date}", "May 1, 2026"))).toBeInTheDocument();

    wrap(<ResultView id="missing" />);
    expect(await screen.findByText(en.result.notFound.title)).toBeInTheDocument();
  });

  it("shows the safety pathway when the reset was flagged", async () => {
    const repo = new LocalResetRepository(window.localStorage);
    const answers = { overwhelm: 5, areas: ["kids" as const], time: "under30" as const, moneyPressure: false, mustHappen: "x" };
    await repo.save({
      id: "flag",
      createdAt: new Date().toISOString(),
      locale: "en",
      answers,
      plan: new DeterministicResetPlanner().plan(answers),
      safetyFlag: true,
    });
    wrap(<ResultView id="flag" />);
    expect(await screen.findByText(en.safety.emergency)).toBeInTheDocument();
  });
});
