"use client";

import { Button } from "@/src/shared/components/Button";
import { cn } from "@/src/shared/utils/cn";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

function AlertDialog(props: ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}
function AlertDialogTrigger(
  props: ComponentProps<typeof AlertDialogPrimitive.Trigger>,
) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}
function AlertDialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        data-slot="alert-dialog-overlay"
        className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-black/50 motion-reduce:animate-none"
      />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-surface data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 fixed top-1/2 left-1/2 z-50 grid w-11/12 max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border p-6 shadow-lg motion-reduce:animate-none",
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}
function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}
function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}
function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm leading-6", className)}
      {...props}
    />
  );
}
function AlertDialogAction({
  variant = "default",
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<ComponentProps<typeof Button>, "variant">) {
  return (
    <Button variant={variant} asChild>
      <AlertDialogPrimitive.Action data-slot="alert-dialog-action" {...props} />
    </Button>
  );
}
function AlertDialogCancel(
  props: ComponentProps<typeof AlertDialogPrimitive.Cancel>,
) {
  return (
    <Button variant="outline" asChild>
      <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" {...props} />
    </Button>
  );
}
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
