"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

export default function StoryCover({ src, loading }: { src?: string; loading?: "lazy" }) {
  const [failedSource, setFailedSource] = useState<string>();

  if (!src || src === failedSource) {
    return (
      <div aria-hidden="true" className="grid h-full w-full place-items-center bg-zinc-100">
        <div className="grid h-4/5 w-3/4 place-items-center border border-zinc-300">
          <BookOpen className="size-10 text-zinc-500" strokeWidth={1} />
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading={loading}
      onError={() => setFailedSource(src)}
      className="h-full w-full object-cover grayscale transition duration-300 group-hover:scale-[1.02] group-hover:grayscale-0"
    />
  );
}
