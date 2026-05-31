"use client";

import { Globe, Mail, MapPin, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Company } from "@/types";

interface Props {
  companies: Company[];
  onDelete: (id: number) => void;
}

export default function CompanyList({ companies, onDelete }: Props) {
  if (companies.length === 0) {
    return <p className="text-sm text-gray-400">Henüz şirket yok.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {companies.map((company) => (
        <Card key={company.id}>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">{company.name}</p>
                {company.industry && (
                  <p className="text-xs text-gray-400">{company.industry}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-500 shrink-0"
                onClick={() => onDelete(company.id)}
              >
                <Trash2 size={15} />
              </Button>
            </div>

            <div className="space-y-1 text-sm text-gray-500">
              {company.location && (
                <p className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {company.location}
                </p>
              )}
              {company.contact_person && (
                <p className="flex items-center gap-1.5">
                  <User size={13} />
                  {company.contact_person}
                </p>
              )}
              {company.contact_email && (
                <p className="flex items-center gap-1.5">
                  <Mail size={13} />
                  {company.contact_email}
                </p>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-500 hover:underline"
                >
                  <Globe size={13} />
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
