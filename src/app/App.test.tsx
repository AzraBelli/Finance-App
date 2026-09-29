import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { TRANSACTIONS_STORAGE_KEY } from "@/repositories/LocalStorageTransactionRepository";
import { useFinanceStore, useSettingsStore, useUiStore } from "@/store/useFinanceStore";
import App from "./App";

const MINUS = "−";

function setup() {
  const user = userEvent.setup();
  render(<App />);
  return user;
}

async function addTransaction(
  user: ReturnType<typeof userEvent.setup>,
  { type = "expense", amount, category, note }: { type?: "expense" | "income"; amount: string; category: string; note?: string },
) {
  await user.click(screen.getAllByRole("button", { name: /add transaction/i })[0]);
  const dialog = await screen.findByRole("dialog", { name: "Add transaction" });
  if (type === "income") {
    await user.click(within(within(dialog).getByRole("radiogroup", { name: "Transaction type" })).getByRole("radio", { name: "Income" }));
  }
  await user.type(within(dialog).getByLabelText("Amount"), amount);
  await user.click(within(dialog).getByRole("button", { name: category }));
  if (note) await user.type(within(dialog).getByLabelText(/note/i), note);
  await user.click(within(dialog).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

const txList = () => screen.getByRole("region", { name: "Transactions" });
const summary = () => screen.getByRole("region", { name: "Period summary" });
const storedTransactions = () =>
  JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) ?? '{"transactions":[]}').transactions as unknown[];

beforeEach(() => {
  toast.dismiss(); // sonner's toast queue is module-global
  localStorage.clear();
  useFinanceStore.setState(useFinanceStore.getInitialState(), true);
  useUiStore.setState(useUiStore.getInitialState(), true);
  useSettingsStore.setState({ currency: "USD", theme: "system" });
});

describe("App (DOM)", () => {
  it("loads and shows empty states", async () => {
    setup();
    expect(await screen.findByText("No transactions in this period.")).toBeInTheDocument();
    expect(screen.getByText("No expenses in this period.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Finance dashboard/);
    expect(within(summary()).getByText("Total income")).toBeInTheDocument();
  });

  it("validates the form before saving", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await user.click(screen.getAllByRole("button", { name: /add transaction/i })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Add transaction" });

    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Enter an amount")).toBeInTheDocument();
    expect(within(dialog).getByText("Choose a category")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Amount"), "abc");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText(/Enter a valid amount/)).toBeInTheDocument();

    // Extra decimals are rounded on blur instead of being rejected
    await user.clear(within(dialog).getByLabelText("Amount"));
    await user.type(within(dialog).getByLabelText("Amount"), "1.234");
    await user.tab();
    expect(within(dialog).getByLabelText("Amount")).toHaveValue("1.23");

    expect(storedTransactions()).toHaveLength(0);
  });

  it("adds an expense and updates list, summary, chart legend and storage", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await addTransaction(user, { amount: "1250.5", category: "Groceries", note: "Weekly groceries" });

    expect(await screen.findByText("Expense added")).toBeInTheDocument();
    expect(
      within(txList()).getByRole("button", { name: new RegExp(`^Expense: Groceries, ${MINUS}\\$1,250\\.50, .*Weekly groceries`) }),
    ).toBeInTheDocument();
    // Total expenses and net balance
    expect(within(summary()).getAllByText(`${MINUS}$1,250`)).toHaveLength(2);
    expect(screen.getByRole("list", { name: "Expense categories" })).toHaveTextContent(/Groceries.*\$1,250\.50.*100%/);
    expect(storedTransactions()).toHaveLength(1);
  });

  it("adds income with the N shortcut and computes the net balance", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await addTransaction(user, { amount: "200", category: "Dining" });

    await user.keyboard("n");
    const dialog = await screen.findByRole("dialog", { name: "Add transaction" });
    await user.click(within(dialog).getByRole("radio", { name: "Income" }));
    await user.type(within(dialog).getByLabelText("Amount"), "3000");
    await user.click(within(dialog).getByRole("button", { name: "Salary" }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(await screen.findByText("Income added")).toBeInTheDocument();
    expect(within(summary()).getByText("+$2,800")).toBeInTheDocument();
    expect(within(summary()).getByText("+$3,000")).toBeInTheDocument();
    expect(within(txList()).getByText("2 transactions", { exact: false })).toBeInTheDocument();
  });

  it("edits a transaction by clicking its row", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await addTransaction(user, { amount: "40", category: "Transport" });

    await user.click(within(txList()).getByRole("button", { name: /^Expense: Transport/ }));
    const dialog = await screen.findByRole("dialog", { name: "Edit transaction" });
    const amount = within(dialog).getByLabelText("Amount");
    expect(amount).toHaveValue("40");
    await user.clear(amount);
    await user.type(amount, "55.25");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Transaction updated")).toBeInTheDocument();
    expect(within(txList()).getByRole("button", { name: new RegExp(`Transport, ${MINUS}\\$55\\.25`) })).toBeInTheDocument();
    expect(storedTransactions()).toHaveLength(1);
  });

  it("filters the list by search and by clicking a legend category", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await addTransaction(user, { amount: "100", category: "Groceries", note: "Market" });
    await addTransaction(user, { amount: "30", category: "Dining", note: "Pizza" });

    await user.type(within(txList()).getByRole("searchbox", { name: "Search notes" }), "pizza");
    expect(within(txList()).queryByRole("button", { name: /Groceries/ })).not.toBeInTheDocument();
    expect(within(txList()).getByRole("button", { name: /Dining/ })).toBeInTheDocument();

    await user.click(within(txList()).getByRole("button", { name: "Clear filters" }));
    await user.click(within(screen.getByRole("list", { name: "Expense categories" })).getByRole("button", { name: /Groceries/ }));
    expect(within(txList()).getByRole("button", { name: "Remove Groceries filter" })).toBeInTheDocument();
    expect(within(txList()).queryByRole("button", { name: /^Expense: Dining/ })).not.toBeInTheDocument();
    expect(within(txList()).getByRole("button", { name: /^Expense: Groceries/ })).toBeInTheDocument();

    await user.type(within(txList()).getByRole("searchbox", { name: "Search notes" }), "zzz");
    expect(within(txList()).getByText("No transactions match these filters.")).toBeInTheDocument();
  });

  it("deletes with the Delete key and restores with Undo", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await addTransaction(user, { amount: "12", category: "Health", note: "Pharmacy" });

    within(txList()).getByRole("button", { name: /^Expense: Health/ }).focus();
    await user.keyboard("{Delete}");
    expect(await screen.findByText("Transaction deleted")).toBeInTheDocument();
    expect(within(txList()).getByText("No transactions in this period.")).toBeInTheDocument();
    expect(storedTransactions()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(await screen.findByText("Transaction restored")).toBeInTheDocument();
    expect(within(txList()).getByRole("button", { name: /^Expense: Health.*Pharmacy/ })).toBeInTheDocument();
    expect(storedTransactions()).toHaveLength(1);
  });

  it("deletes from the row menu", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await addTransaction(user, { amount: "9.99", category: "Entertainment" });

    await user.click(within(txList()).getByRole("button", { name: "Transaction options" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(await screen.findByText("Transaction deleted")).toBeInTheDocument();
    expect(storedTransactions()).toHaveLength(0);
  });

  it("changes currency and deletes all data from settings", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await addTransaction(user, { amount: "80", category: "Bills" });

    // Sidebar and mobile nav are both in the DOM (jsdom ignores the md:hidden CSS)
    await user.click(screen.getAllByRole("button", { name: "Settings" })[0]);
    const sheet = await screen.findByRole("dialog", { name: "Settings" });
    expect(within(sheet).getByText("1 transaction saved.")).toBeInTheDocument();
    await user.click(within(sheet).getByRole("radio", { name: "€ EUR" }));
    // The open sheet marks the rest of the page aria-hidden
    const list = screen.getByRole("region", { name: "Transactions", hidden: true });
    expect(within(list).getByRole("button", { name: new RegExp(`Bills, ${MINUS}€80\\.00`), hidden: true })).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: /Delete all data/ }));
    const confirm = await screen.findByRole("alertdialog", { name: "Delete all data?" });
    await user.click(within(confirm).getByRole("button", { name: "Delete all" }));
    expect(await screen.findByText("All data deleted")).toBeInTheDocument();
    expect(storedTransactions()).toHaveLength(0);
  });

  it("reloads saved transactions from localStorage", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    await addTransaction(user, { amount: "500", category: "Rent" });

    // Simulate a page reload: fresh store state, same storage
    await act(async () => {
      useFinanceStore.setState({ transactions: [], status: "idle" });
      await useFinanceStore.getState().load();
    });
    expect(within(txList()).getByRole("button", { name: new RegExp(`^Expense: Rent, ${MINUS}\\$500\\.00`) })).toBeInTheDocument();
  });

  it("navigates periods", async () => {
    const user = setup();
    await screen.findByText("No transactions in this period.");
    const h1 = screen.getByRole("heading", { level: 1 });
    const current = h1.textContent;
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(h1.textContent).not.toBe(current);
    await user.click(screen.getByRole("button", { name: "All time" }));
    expect(h1).toHaveTextContent("All time");
    expect(screen.queryByRole("button", { name: "Previous month" })).not.toBeInTheDocument();
  });
});
