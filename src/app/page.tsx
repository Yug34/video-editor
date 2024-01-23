"use client";
import {ModeToggle} from "@/components/theme-toggler";
import {Editor} from "@/components/Editor";

export default function Home() {
    return (
        <div className="h-full flex-col">
            <div className={"container flex items-center justify-between space-y-2 py-4 rounded-lg border-solid border-b py-2 px-10"}>
                <h2 className="flex text-lg font-semibold">Video Editor</h2>
                <ModeToggle/>
            </div>
            <Editor/>
        </div>
    );
}
