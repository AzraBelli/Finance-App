import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Theme comes from the app's own setting (next-themes is not used). */
const Toaster = ({ dark, ...props }: ToasterProps & { dark: boolean }) => (
  <Sonner
    theme={dark ? "dark" : "light"}
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4 text-income" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4 text-expense" />,
    }}
    toastOptions={{
      classNames: {
        toast: "!rounded-xl !border-line !bg-surface !text-ink !font-sans !shadow-[0_8px_24px_rgba(18,26,25,0.12)]",
        description: "!text-muted-foreground",
        actionButton: "!rounded-full !bg-brand !text-on-brand !font-semibold !px-3",
      },
    }}
    {...props}
  />
);

export { Toaster };
