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

export function CrisisResourcesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1.5">
          <AlertTriangle className="size-3.5" />
          <span className="hidden sm:inline">Crisis Help</span>
        </Button>
      </DialogTrigger>
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
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Phone className="size-3" />
                  {resource.number}
                </div>
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
