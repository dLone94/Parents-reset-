import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { FamilyLoad } from "@/features/load/components/FamilyLoad";
import { LocalLoadRepository } from "@/services/persistence";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/load",
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function wrap(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const L = en.load;

function card(name: string) {
  return screen.getByRole("button", { name: new RegExp(`^${name}`) });
}

describe("Family Load", () => {
  it("shows six categories and an empty state, and adds an item", async () => {
    const user = userEvent.setup();
    const repo = new LocalLoadRepository(window.localStorage);
    wrap(<FamilyLoad repository={repo} />);

    await screen.findByText(L.empty.title);
    for (const label of Object.values(L.categories)) expect(card(label)).toBeInTheDocument();
    expect(screen.getByText("Nothing open right now.")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox"), "Buy new shoes");
    await user.click(screen.getByRole("button", { name: L.add.button }));

    expect(await screen.findByText("Buy new shoes")).toBeInTheDocument();
    expect(screen.getByText("1 thing open across all areas.")).toBeInTheDocument();
    expect(card(L.categories.kids)).toHaveTextContent("1 open");
    expect(card(L.categories.kids)).toHaveTextContent(L.levels.light);
    expect((await repo.list())[0]).toMatchObject({ title: "Buy new shoes", category: "kids", status: "open" });
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("rejects an empty title with a translated error", async () => {
    const user = userEvent.setup();
    wrap(<FamilyLoad repository={new LocalLoadRepository(window.localStorage)} />);
    await screen.findByText(L.empty.title);
    await user.click(screen.getByRole("button", { name: L.add.button }));
    expect(await screen.findByRole("alert")).toHaveTextContent(L.errors.required);
  });

  it("completes, undoes, postpones and brings back an item", async () => {
    const user = userEvent.setup();
    const repo = new LocalLoadRepository(window.localStorage);
    wrap(<FamilyLoad repository={repo} />);
    await screen.findByText(L.empty.title);

    await user.type(screen.getByRole("textbox"), "Dentist appointment{enter}");
    const row = () => screen.getByText("Dentist appointment").closest("li") as HTMLElement;

    // complete
    await user.click(within(row()).getByRole("button", { name: L.actions.done }));
    await waitFor(() => expect(screen.getByText(`${L.sections.done} · 1`)).toBeInTheDocument());
    expect((await repo.list())[0].status).toBe("done");
    expect(card(L.categories.kids)).toHaveTextContent("Nothing open");

    // undo (the check circle and the text button both undo; use the text button)
    await user.click(within(row()).getAllByRole("button", { name: L.actions.undo })[1]);
    await waitFor(() => expect(screen.getByText(`${L.sections.open} · 1`)).toBeInTheDocument());

    // postpone
    await user.click(within(row()).getByRole("button", { name: L.actions.postpone }));
    await waitFor(() => expect(screen.getByText(`${L.sections.postponed} · 1`)).toBeInTheDocument());
    const stored = (await repo.list())[0];
    expect(stored.status).toBe("postponed");
    expect(stored.postponedUntil).toBeTruthy();
    expect(within(row()).getByText(/^Back on /)).toBeInTheDocument();

    // bring back
    await user.click(within(row()).getByRole("button", { name: L.actions.bringBack }));
    await waitFor(() => expect(screen.getByText(`${L.sections.open} · 1`)).toBeInTheDocument());
    expect((await repo.list())[0].status).toBe("open");
  });

  it("moves an item to another category", async () => {
    const user = userEvent.setup();
    const repo = new LocalLoadRepository(window.localStorage);
    wrap(<FamilyLoad repository={repo} />);
    await screen.findByText(L.empty.title);

    await user.type(screen.getByRole("textbox"), "Electricity bill{enter}");
    const row = screen.getByText("Electricity bill").closest("li") as HTMLElement;
    await user.selectOptions(within(row).getByRole("combobox", { name: L.actions.move }), "money");

    // Item leaves the Kids panel and appears under Money.
    await waitFor(() => expect(screen.queryByText("Electricity bill")).not.toBeInTheDocument());
    expect(card(L.categories.money)).toHaveTextContent("1 open");
    expect((await repo.list())[0].category).toBe("money");

    await user.click(card(L.categories.money));
    expect(await screen.findByText("Electricity bill")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(L.categories.money);
  });

  it("clears done items in the selected category only", async () => {
    const user = userEvent.setup();
    const repo = new LocalLoadRepository(window.localStorage);
    const now = new Date().toISOString();
    await repo.add({ id: "k", category: "kids", title: "Kids done", status: "done", createdAt: now, updatedAt: now });
    await repo.add({ id: "m", category: "money", title: "Money done", status: "done", createdAt: now, updatedAt: now });
    wrap(<FamilyLoad repository={repo} />);

    await screen.findByText("Kids done");
    await user.click(screen.getByRole("button", { name: L.actions.clearDone }));
    await waitFor(() => expect(screen.queryByText("Kids done")).not.toBeInTheDocument());
    expect((await repo.list()).map((i) => i.id)).toEqual(["m"]);
  });

  it("keeps items across a reload (guest persistence)", async () => {
    const user = userEvent.setup();
    const { unmount } = wrap(<FamilyLoad repository={new LocalLoadRepository(window.localStorage)} />);
    await screen.findByText(L.empty.title);
    await user.type(screen.getByRole("textbox"), "Laundry{enter}");
    await screen.findByText("Laundry");
    unmount();

    wrap(<FamilyLoad repository={new LocalLoadRepository(window.localStorage)} />);
    expect(await screen.findByText("Laundry")).toBeInTheDocument();
  });

  it("accepts CJK titles verbatim", async () => {
    const user = userEvent.setup();
    const repo = new LocalLoadRepository(window.localStorage);
    wrap(<FamilyLoad repository={repo} />);
    await screen.findByText(L.empty.title);
    await user.type(screen.getByRole("textbox"), "歯医者の予約{enter}");
    expect(await screen.findByText("歯医者の予約")).toBeInTheDocument();
    expect((await repo.list())[0].title).toBe("歯医者の予約");
  });
});
