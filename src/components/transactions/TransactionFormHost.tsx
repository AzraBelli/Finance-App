import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/lib/hooks";
import type { Transaction } from "@/lib/types";
import { useUiStore } from "@/store/useFinanceStore";
import { TransactionForm } from "./TransactionForm";
import { useDeleteWithUndo } from "./TransactionList";

/** Dialog on desktop, bottom Sheet on mobile. */
export function TransactionFormHost() {
  const form = useUiStore((s) => s.form);
  const closeForm = useUiStore((s) => s.closeForm);
  const deleteWithUndo = useDeleteWithUndo();
  const isDesktop = useIsDesktop();

  const title = form.editing ? "Edit transaction" : "Add transaction";
  const description = form.editing
    ? "The chart and summary update when you save."
    : "Enter the amount, category and date.";
  const onOpenChange = (open: boolean) => !open && closeForm();
  const onDelete = (t: Transaction) => {
    closeForm();
    void deleteWithUndo(t);
  };

  const body = (
    <TransactionForm
      key={form.editing?.id ?? "new"}
      editing={form.editing}
      presetType={form.presetType}
      onDone={closeForm}
      onDelete={onDelete}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={form.open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-6 rounded-panel border-line p-6 sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={form.open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] gap-0 overflow-y-auto rounded-t-panel border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-line" />
        <SheetHeader className="px-0 pt-4">
          <SheetTitle className="font-display text-xl font-semibold">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}
