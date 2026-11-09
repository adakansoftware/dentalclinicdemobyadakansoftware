import { test, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import FAQAccordion from "@/components/shared/FAQAccordion";

afterEach(cleanup);

const items = [
  { question: "Randevu nasıl alınır?", answer: "Formu doldurun, biz arayalım." },
  { question: "Sigorta geçerli mi?", answer: "Çoğu sigorta kabul edilir." },
];

test("renders all questions collapsed by default", () => {
  render(<FAQAccordion items={items} />);
  for (const item of items) {
    const button = screen.getByText(item.question).closest("button");
    expect(button?.getAttribute("aria-expanded")).toBe("false");
  }
  expect(screen.getByText(items[0].answer)).toBeTruthy();
});

test("clicking a question expands it and collapses on second click", () => {
  render(<FAQAccordion items={items} />);
  const button = screen.getByText(items[0].question).closest("button")!;

  fireEvent.click(button);
  expect(button.getAttribute("aria-expanded")).toBe("true");

  fireEvent.click(button);
  expect(button.getAttribute("aria-expanded")).toBe("false");
});

test("defaultOpen expands the given index", () => {
  render(<FAQAccordion items={items} defaultOpen={1} />);
  const second = screen.getByText(items[1].question).closest("button");
  expect(second?.getAttribute("aria-expanded")).toBe("true");
});
