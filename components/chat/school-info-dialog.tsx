"use client";

import * as React from "react";
import {
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface SchoolInfoDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SchoolInfoDialog({
  trigger,
  open,
  onOpenChange,
}: SchoolInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header tanpa icon & tanpa badge */}
        <DialogHeader className="text-left border-b border-border/40 pb-3">
          <DialogTitle className="text-lg font-bold sm:text-xl text-foreground tracking-tight">
            Informasi & Kontak Sekolah
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            SMK Negeri 2 Surakarta · Layanan Informasi & Posko PPDB
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 pt-1">
          {/* Posko & Alamat Sekolah */}
          <Card size="sm" className="bg-muted/30 border-border/50">
            <CardContent className="flex flex-col gap-2 p-3.5">
              <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm">
                <MapPin className="size-4 text-primary shrink-0" />
                <span>Alamat & Lokasi Sekolah</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground pl-6">
                Jl. Adi Sucipto No. 33, Manahan, Kec. Banjarsari, Kota
                Surakarta, Jawa Tengah 57139
              </p>
              <div className="pl-6 pt-1">
                <Button
                  variant="outline"
                  size="xs"
                  asChild
                  className="w-fit text-xs gap-1.5"
                >
                  <a
                    href="https://maps.google.com/?q=SMK+Negeri+2+Surakarta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Buka di Google Maps</span>
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grid: Jam Layanan & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Jam Layanan */}
            <Card size="sm" className="bg-muted/30 border-border/50">
              <CardContent className="flex flex-col gap-2 p-3.5">
                <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                  <Clock className="size-3.5 text-primary shrink-0" />
                  <span>Jam Layanan Posko</span>
                </div>
                <div className="flex flex-col gap-1 pl-5.5">
                  <span className="text-xs font-semibold text-foreground">
                    Senin – Jumat
                  </span>
                  <span className="text-xs text-muted-foreground">
                    08.00 – 15.00 WIB
                  </span>
                  <span className="text-[11px] text-muted-foreground/75 pt-1">
                    *Sabtu, Minggu & Hari Libur Nasional tutup
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Kontak Resmi */}
            <Card size="sm" className="bg-muted/30 border-border/50">
              <CardContent className="flex flex-col gap-2 p-3.5">
                <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                  <Phone className="size-3.5 text-primary shrink-0" />
                  <span>Kontak Resmi</span>
                </div>
                <div className="flex flex-col gap-1.5 pl-5.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Telepon:</span>
                    <a
                      href="tel:0271714901"
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      (0271) 714901
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <a
                      href="mailto:info@smkn2solo.sch.id"
                      className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[150px]"
                      title="info@smkn2solo.sch.id"
                    >
                      info@smkn2solo.sch.id
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tautan Resmi */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-semibold text-foreground px-0.5">
              Tautan & Kanal Resmi
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Website Resmi */}
              <a
                href="https://smkn2solo.sch.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="size-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-foreground truncate">
                      Website Resmi Sekolah
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      smkn2solo.sch.id
                    </span>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 ml-1.5 transition-colors" />
              </a>

              {/* Portal PPDB Jateng */}
              <a
                href="https://ppdb.jatengprov.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="size-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-foreground truncate">
                      Portal PPDB Jateng
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      ppdb.jatengprov.go.id
                    </span>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 ml-1.5 transition-colors" />
              </a>

              {/* Telegram Info PPDB */}
              <a
                href="https://t.me/+mBWD8k7ebu84ZjY9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all group sm:col-span-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageCircle className="size-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-foreground truncate">
                      Grup Telegram Info Resmi SMKN 2 Surakarta
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      t.me/+mBWD8k7ebu84ZjY9 (Informasi Terupdate)
                    </span>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 ml-1.5 transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
