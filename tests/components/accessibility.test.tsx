import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { WeatherPicker } from "@/features/evening/components/WeatherPicker";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
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

/** A minimal group in the shape the app uses: buttons with role="radio". */
function Colours({ onPick }: { onPick?: (value: string) => void }) {
  const [value, setValue] = useState("red");
  return (
    <RadioGroup label="Colours" className="flex">
      {["red", "green", "blue"].map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => {
            setValue(option);
            onPick?.(option);
          }}
        >
          {option}
        </button>
      ))}
    </RadioGroup>
  );
}

describe("radio groups", () => {
  it("puts only the selected option in the tab order", () => {
    wrap(<Colours />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("tabindex", "0");
    expect(radios[1]).toHaveAttribute("tabindex", "-1");
    expect(radios[2]).toHaveAttribute("tabindex", "-1");
  });

  it("moves the selection with the arrow keys", async () => {
    const user = userEvent.setup();
    const picked: string[] = [];
    wrap(<Colours onPick={(value) => picked.push(value)} />);
    const radios = screen.getAllByRole("radio");

    radios[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(radios[1]).toHaveFocus();
    expect(picked).toEqual(["green"]);

    await user.keyboard("{ArrowRight}");
    expect(radios[2]).toHaveFocus();

    // Wraps around the end, and Home/End jump to the edges.
    await user.keyboard("{ArrowRight}");
    expect(radios[0]).toHaveFocus();
    await user.keyboard("{End}");
    expect(radios[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(radios[0]).toHaveFocus();
  });

  it("follows the selection when it moves, so tab order tracks it", async () => {
    const user = userEvent.setup();
    wrap(<Colours />);
    const radios = screen.getAllByRole("radio");
    radios[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(radios[1]).toHaveAttribute("tabindex", "0");
    expect(radios[0]).toHaveAttribute("tabindex", "-1");
  });

  it("gives the weather picker the same keyboard behaviour", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    wrap(<WeatherPicker onChange={onChange} />);

    screen.getByRole("radio", { name: en.evening.weather.options.storm }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: en.evening.weather.options.rain })).toHaveFocus();
    expect(onChange).toHaveBeenCalledWith("rain");
  });
});

describe("offline banner", () => {
  it("stays quiet while online", () => {
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    wrap(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    onLine.mockRestore();
  });

  it("says what still works once the signal goes", async () => {
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    wrap(<OfflineBanner />);
    expect(await screen.findByRole("status")).toHaveTextContent(en.offline.banner);
    onLine.mockRestore();
  });
});
