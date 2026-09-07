"use client";

import * as React from "react";
import {
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  School,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <School className="size-5" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">Stemsa Solo</Badge>
              <Badge variant="outline">PPDB 2026</Badge>
            </div>
          </div>
          <DialogTitle className="text-lg font-bold sm:text-xl">
            Informasi & Kontak SMKN 2 Surakarta
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Posko Resmi PPDB 2026 & Layanan Informasi
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          {/* Posko PPDB & Alamat */}
          <Card size="sm" className="bg-muted/30">
            <CardContent className="flex flex-col gap-2 p-3">
              <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm">
                <MapPin className="size-4 text-primary shrink-0" />
                <span>Posko PPDB & Alamat Sekolah</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground pl-6">
                Jl. LU. Adisucipto No. 33, Manahan, Kec. Banjarsari, Kota
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
                    <span>Petunjuk Arah (Google Maps)</span>
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Jam Layanan Posko */}
          <Card size="sm" className="bg-muted/30">
            <CardContent className="flex flex-col gap-2 p-3">
              <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm">
                <Clock className="size-4 text-primary shrink-0" />
                <span>Jam Layanan Posko</span>
              </div>
              <div className="flex flex-col gap-1 pl-6">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px] h-4 px-1.5">
                    Senin – Jumat
                  </Badge>
                  <span className="text-xs font-medium text-foreground">
                    08.00 – 15.00 WIB
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  *Sabtu, Minggu & Hari Libur Nasional layanan posko tatap muka
                  libur
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Kontak & Hotline */}
          <Card size="sm" className="bg-muted/30">
            <CardContent className="flex flex-col gap-3 p-3">
              <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm">
                <Phone className="size-4 text-primary shrink-0" />
                <span>Kontak & Hotline</span>
              </div>
              <div className="flex flex-col gap-2 pl-6">
                {/* Telepon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="text-muted-foreground">Telepon Kantor:</span>
                  <a
                    href="tel:0271714901"
                    className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <span>(0271) 714901</span>
                  </a>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1 text-xs pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="size-3.5" />
                    <span>Email Resmi:</span>
                  </div>
                  <div className="flex flex-col gap-1 pl-5">
                    <a
                      href="mailto:smkn2solo@yahoo.co.id"
                      className="font-medium text-foreground hover:text-primary transition-colors text-xs"
                    >
                      smkn2solo@yahoo.co.id
                    </a>
                    <a
                      href="mailto:ppdb@smkn2surakarta.sch.id"
                      className="font-medium text-foreground hover:text-primary transition-colors text-xs"
                    >
                      ppdb@smkn2surakarta.sch.id
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tautan Resmi */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-semibold text-foreground px-1">
              Tautan Resmi PPDB & Sekolah
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

              <a
                href="https://smkn2surakarta.sch.id"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <School className="size-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-foreground truncate">
                      Website Resmi Sekolah
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      smkn2surakarta.sch.id
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
