import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
}: PlaceholderScreenProps) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            {eyebrow}
          </Badge>
          <CardTitle className="font-heading text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Voltar ao início
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
