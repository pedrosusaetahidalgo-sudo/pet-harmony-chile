import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || "Error desconocido" };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
          <p className="text-muted-foreground mb-4">
            Hubo un error al cargar esta página.
          </p>
          <p className="text-xs text-muted-foreground bg-muted rounded p-2 mb-6 max-w-md font-mono break-all">
            {this.state.errorMessage}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => this.setState({ hasError: false })}>
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/home"}>
              Ir al inicio
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
