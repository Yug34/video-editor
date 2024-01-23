"use client";
import { ModeToggle } from "@/components/theme-toggler";
import { Editor } from "@/components/Editor";

export default function Home() {
  return (
    <div className="container flex h-full w-full flex-col p-0">
      <div className="flex items-center justify-between rounded-lg border-solid border-b py-2">
        <h2 className="flex text-lg font-semibold">Video Editor</h2>
        <ModeToggle />
      </div>
      <Editor />
    </div>
  );
}
