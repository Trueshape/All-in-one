import { useState } from "react";
import { Segmented, Stack } from "../ui/kit";
import PomodoroTimer from "./PomodoroTimer";
import TodoList from "./TodoList";

type Tab = "timer" | "todo";

/** Both tabs stay mounted and the inactive one is hidden, so state (a running timer, a typed value) survives a tab switch. */
export default function FocusTools() {
  const [tab, setTab] = useState<Tab>("timer");

  return (
    <Stack>
      <Segmented
        fill
        value={tab}
        onChange={setTab}
        options={[{ value: "timer", label: "Timer & Pomodoro" }, { value: "todo", label: "To Do List" }]}
      />
      <div hidden={tab !== "timer"}><PomodoroTimer /></div>
      <div hidden={tab !== "todo"}><TodoList /></div>
    </Stack>
  );
}
