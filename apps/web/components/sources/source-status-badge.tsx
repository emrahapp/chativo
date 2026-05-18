import { Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SourceStatusBadge({ status }: { status: "pending" | "processing" | "completed" | "failed" }) {
  if (status === "completed") {
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" />
        Tamamlandı
      </Badge>
    );
  }
  if (status === "processing") {
    return (
      <Badge variant="default">
        <Loader2 className="h-3 w-3 animate-spin" />
        İşleniyor
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="danger">
        <AlertTriangle className="h-3 w-3" />
        Hata
      </Badge>
    );
  }
  return (
    <Badge variant="muted">
      <Clock className="h-3 w-3" />
      Bekliyor
    </Badge>
  );
}
