import { Component } from "react";
import type { ReactNode } from "react";
import { Button, Notice, Stack } from "./kit";

/** Shown when a tool cannot be loaded or crashes while drawing, instead of leaving the whole page blank. */
function Failed() {
  return (
    <Stack>
      <Notice tone="error">
        Non riesco ad aprire questo strumento. Può essere un problema di rete, oppure il sito è stato aggiornato mentre la pagina era aperta.
      </Notice>
      <div>
        <Button variant="primary" onClick={() => window.location.reload()}>Ricarica la pagina</Button>
      </div>
    </Stack>
  );
}

/**
 * Catches what goes wrong inside one tool (a script that fails to download, an error in its code) so that only that tool is replaced
 * by a message: the window, the other tools and the page stay usable. Give it a `key` that changes with the tool, so a new tool starts clean.
 */
export class ToolErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Tool failed to load or render:", error);
  }

  render() {
    return this.state.failed ? <Failed /> : this.props.children;
  }
}
