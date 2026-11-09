import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import StarRating from "@/components/shared/StarRating";

afterEach(cleanup);

test("renders five stars with accessible rating label", () => {
  render(<StarRating stars={4} />);
  const container = screen.getByLabelText("4/5");
  expect(container.querySelectorAll("svg").length).toBe(5);
});

test("filled stars reflect rating via opacity", () => {
  render(<StarRating stars={2} />);
  const container = screen.getByLabelText("2/5");
  const svgs = Array.from(container.querySelectorAll("svg"));
  const filled = svgs.filter((svg) => svg.className.baseVal.includes("opacity-100"));
  const empty = svgs.filter((svg) => svg.className.baseVal.includes("opacity-25"));
  expect(filled.length).toBe(2);
  expect(empty.length).toBe(3);
});
