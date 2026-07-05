"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONTACT_EMAIL = "a.correa2675@gmail.com";

export function ContactDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.status === 503) {
        // Resend isn't configured yet — fall back to the visitor's own mail client.
        const subject = encodeURIComponent(`Mensaje de ${name} — ¡ECHAMELO!`);
        const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        setOpen(false);
        setStatus("idle");
        return;
      }

      if (!res.ok) throw new Error("send failed");

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 w-full gap-2")}
          />
        }
      >
        <Mail className="h-4 w-4" />
        Contáctanos
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gold" />
            Contáctanos
          </DialogTitle>
          <DialogDescription>
            Escríbenos y te responderemos lo antes posible. No necesitas tener cuenta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-name" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Tu nombre
            </Label>
            <Input
              id="contact-name"
              required
              placeholder="¿Cómo te llamas?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-email" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Tu email
            </Label>
            <Input
              id="contact-email"
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-message" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Mensaje
            </Label>
            <Textarea
              id="contact-message"
              required
              rows={5}
              placeholder="Cuéntanos en qué podemos ayudarte..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-destructive">
              No se pudo enviar el mensaje. Inténtalo de nuevo.
            </p>
          )}
          {status === "sent" && <p className="text-sm text-gold">¡Mensaje enviado!</p>}

          <Button
            type="submit"
            disabled={status === "sending" || status === "sent"}
            className="h-11 bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {status === "sending" ? "Enviando..." : "Enviar mensaje"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
