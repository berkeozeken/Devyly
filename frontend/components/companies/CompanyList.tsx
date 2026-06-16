"use client";

import { CheckCircle2, Clock, Globe, Mail, MapPin, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Company } from "@/types";

interface Props {
  companies: Company[];
  onDelete: (id: number) => void;
}

export default function CompanyList({ companies, onDelete }: Props) {
  if (companies.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">Henüz şirket yok.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {companies.map((company) => (
        <Card key={company.id} className="hover:border-border-strong">
          <CardContent className="py-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-[15px]">{company.name}</p>
                  {company.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={11} />
                      Doğrulandı
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 dark:text-amber-400">
                      <Clock size={11} />
                      Doğrulanmadı
                    </span>
                  )}
                </div>
                {company.industry && (
                  <p className="text-xs text-muted-foreground mt-0.5">{company.industry}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                onClick={() => onDelete(company.id)}
              >
                <Trash2 size={13} />
              </Button>
            </div>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              {company.location && (
                <p className="flex items-center gap-2">
                  <MapPin size={12} className="shrink-0 opacity-60" />
                  {company.location}
                </p>
              )}
              {company.contact_person && (
                <p className="flex items-center gap-2">
                  <User size={12} className="shrink-0 opacity-60" />
                  {company.contact_person}
                </p>
              )}
              {company.contact_email && (
                <p className="flex items-center gap-2">
                  <Mail size={12} className="shrink-0 opacity-60" />
                  {company.contact_email}
                </p>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Globe size={12} className="shrink-0 opacity-60" />
                  {company.website}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
