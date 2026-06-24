"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CRISIS_RESOURCES } from "@/lib/constants";
import { Phone, AlertTriangle } from "lucide-react";

interface CrisisResourcesDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function CrisisResourcesDialog({
  open,
  onOpenChange,
  showTrigger = true,
}: CrisisResourcesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" className="gap-1.5">
            <AlertTriangle className="size-3.5" />
            <span className="hidden sm:inline">Crisis Help</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            Crisis Resources
          </DialogTitle>
          <DialogDescription>
            If you&apos;re in immediate danger or having thoughts of self-harm,
            please reach out to one of these resources immediately.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-3">
            {CRISIS_RESOURCES.map((resource) => (
              <div
                key={resource.name}
                className="rounded-xl border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium leading-tight">
                    {resource.name}
                  </h4>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {resource.region}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {resource.description}
                </p>
                {resource.number.startsWith("tel:") || resource.number.includes("+234") || resource.number.includes("0800") ? (
                  <Button asChild variant="outline" size="sm" className="w-full text-xs font-semibold text-primary justify-start gap-2">
                    <a href={`tel:${resource.number.replace(/\s+/g, "")}`}>
                      <Phone className="size-3.5" />
                      {resource.number}
                    </a>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Phone className="size-3" />
                    {resource.number}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          You are not alone. Help is available 24/7.
        </p>
      </DialogContent>
    </Dialog>
  );
}
